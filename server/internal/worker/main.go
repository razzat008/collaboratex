package worker

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/go-redis/redis/v8"
	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type Config struct {
	RedisQueueName string

	MongoDatabase string
	JobCollection string

	MinioBucketPDFs string

	DockerImage string

	// Resource limits for container runs
	MemoryBytes int64
	NanoCPUs    int64
	Timeout     time.Duration
}

type JobPayload struct {
	JobID        string `json:"jobId"`
	UserID       string `json:"userId"`
	DocID        string `json:"docId,omitempty"`
	SourceBucket string `json:"sourceBucket"`
	SourceObject string `json:"sourceObject"`
	MainFile     string `json:"mainFile"`
}

// Run starts the worker main loop. All clients must be already initialized by the caller.
func Run(ctx context.Context, cfg Config, redisClient *redis.Client, mongoClient *mongo.Client, minioClient *minio.Client, dockerCli *client.Client) error {
	if ctx == nil {
		ctx = context.Background()
	}

	jobColl := mongoClient.Database(cfg.MongoDatabase).Collection(cfg.JobCollection)

	// Create handler for status/log updates
	handler := NewHandler(redisClient, minioClient, jobColl, cfg.RedisQueueName, cfg.MinioBucketPDFs)

	log.Printf("worker started (docker image=%s, queue=%s)", cfg.DockerImage, cfg.RedisQueueName)

	// Main loop: BLPOP from Redis queue
	for {
		select {
		case <-ctx.Done():
			log.Println("context canceled, exiting main loop")
			return ctx.Err()
		default:
		}

		// Blocking pop with timeout
		res, err := redisClient.BLPop(ctx, 5*time.Second, cfg.RedisQueueName).Result()
		if err != nil {
			if err == context.Canceled || err == context.DeadlineExceeded {
				continue
			}
			if strings.Contains(err.Error(), "nil") {
				continue
			}
			log.Printf("redis blpop error: %v", err)
			time.Sleep(1 * time.Second)
			continue
		}
		if len(res) < 2 {
			continue
		}
		payload := res[1]
		log.Printf("received job payload: %s", payload)

		var job JobPayload
		if err := json.Unmarshal([]byte(payload), &job); err != nil {
			log.Printf("invalid job payload: %v", err)
			continue
		}

		// Process job in goroutine
		go func(j JobPayload) {
			ctxJob, cancelJob := context.WithTimeout(ctx, cfg.Timeout+30*time.Second)
			defer cancelJob()
			if err := processJob(ctxJob, j, cfg, dockerCli, minioClient, handler); err != nil {
				log.Printf("job %s failed: %v", j.JobID, err)
			} else {
				log.Printf("job %s finished successfully", j.JobID)
			}
		}(job)
	}
}

// processJob handles the complete lifecycle for a single compile job.
func processJob(ctx context.Context, job JobPayload, cfg Config, dockerCli *client.Client, minioClient *minio.Client, handler *Handler) error {
	start := time.Now()
	logPrefix := fmt.Sprintf("[job=%s] ", job.JobID)
	log.Printf(logPrefix + "starting")

	// Update status to running
	_ = handler.UpdateStatus(ctx, job.JobID, "running", "", "")

	// Create workspace
	workspace, err := os.MkdirTemp("", "compile-"+job.JobID+"-")
	if err != nil {
		_ = handler.UpdateStatus(ctx, job.JobID, "failed", "workspace creation failed", "")
		return fmt.Errorf("create workspace: %w", err)
	}
	defer func() {
		_ = os.RemoveAll(workspace)
	}()

	// Download sources from MinIO
	if err := downloadAndExtractFromMinio(ctx, minioClient, job.SourceBucket, job.SourceObject, workspace); err != nil {
		_ = handler.UpdateStatus(ctx, job.JobID, "failed", "failed to fetch source", "")
		return fmt.Errorf("download sources: %w", err)
	}

	// Find main file
	mainFile, err := findMainFile(workspace, job.MainFile, logPrefix)
	if err != nil {
		_ = handler.UpdateStatus(ctx, job.JobID, "failed", "main file missing", "")
		return err
	}

	// Fetch missing assets from MinIO
	fetchMissingAssets(ctx, minioClient, workspace, job, logPrefix)

	// Run compilation
	stdoutStderr, exitCode, err := runTectonicContainer(ctx, dockerCli, cfg, workspace, mainFile)

	// Store logs in Redis (always, even on success)
	_ = handler.StoreLogs(ctx, job.JobID, stdoutStderr)

	// Check for compilation errors
	if err != nil || exitCode != 0 {
		pdfName := strings.TrimSuffix(mainFile, filepath.Ext(mainFile)) + ".pdf"
		pdfPath := filepath.Join(workspace, pdfName)
		if _, statErr := os.Stat(pdfPath); statErr == nil {
			log.Printf(logPrefix+"warning: container exited with code=%d but PDF exists; continuing", exitCode)
		} else {
			errMsg := fmt.Sprintf("compile failed (exit=%d)", exitCode)
			if err != nil {
				errMsg = fmt.Sprintf("compile failed: %v", err)
			}
			_ = handler.UpdateStatus(ctx, job.JobID, "failed", errMsg, "")
			return fmt.Errorf(errMsg)
		}
	}

	// Find and upload PDF
	pdfName := strings.TrimSuffix(mainFile, filepath.Ext(mainFile)) + ".pdf"
	pdfPath := filepath.Join(workspace, pdfName)
	if _, err := os.Stat(pdfPath); err != nil {
		_ = handler.UpdateStatus(ctx, job.JobID, "failed", "pdf not found after compile", "")
		return fmt.Errorf("pdf not found: %w", err)
	}

	// Upload PDF to MinIO
	pdfObject := fmt.Sprintf("%s.pdf", job.JobID)
	if err := uploadFileToMinio(ctx, minioClient, cfg.MinioBucketPDFs, pdfObject, pdfPath); err != nil {
		_ = handler.UpdateStatus(ctx, job.JobID, "failed", "failed to upload pdf", "")
		return fmt.Errorf("upload pdf: %w", err)
	}

	// Generate PDF URL for frontend access
	pdfURL := fmt.Sprintf("/api/compile/%s/pdf", job.JobID)

	// Update status to success
	_ = handler.UpdateStatus(ctx, job.JobID, "success", "", pdfURL)

	log.Printf(logPrefix+"completed in %s", time.Since(start))
	return nil
}

func findMainFile(workspace, requested, logPrefix string) (string, error) {
	if requested == "" {
		requested = "main"
	}

	candidates := []string{}
	seen := make(map[string]bool)
	addCandidate := func(name string) {
		if name == "" || seen[name] {
			return
		}
		candidates = append(candidates, name)
		seen[name] = true
	}

	addCandidate(requested)
	if filepath.Ext(requested) == "" {
		addCandidate(requested + ".tex")
	} else {
		base := strings.TrimSuffix(requested, filepath.Ext(requested))
		addCandidate(base)
		addCandidate(base + ".tex")
	}
	addCandidate("main.tex")

	var extracted []string
	var mainFile string
	found := false

	walkErr := filepath.WalkDir(workspace, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		rel, _ := filepath.Rel(workspace, path)
		extracted = append(extracted, rel)

		for _, c := range candidates {
			if rel == c || filepath.Base(rel) == c {
				mainFile = rel
				return errors.New("__FOUND_MAIN__")
			}
		}
		return nil
	})

	log.Printf(logPrefix+"extracted files: %v", extracted)

	if walkErr != nil && walkErr.Error() == "__FOUND_MAIN__" {
		found = true
	}

	// Heuristic: use sole .tex file if only one exists
	if !found {
		texCount := 0
		var texFile string
		for _, f := range extracted {
			if strings.HasSuffix(strings.ToLower(f), ".tex") {
				texCount++
				texFile = f
			}
		}
		if texCount == 1 {
			mainFile = texFile
			found = true
			log.Printf(logPrefix+"heuristic: using sole .tex file %s as main", mainFile)
		}
	}

	if !found {
		return "", fmt.Errorf("main file missing: tried %v; extracted: %v", candidates, extracted)
	}

	return mainFile, nil
}

func fetchMissingAssets(ctx context.Context, minioClient *minio.Client, workspace string, job JobPayload, logPrefix string) {
	graphicsRe := regexp.MustCompile(`\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}`)
	refs := map[string]struct{}{}

	_ = filepath.WalkDir(workspace, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || (!strings.HasSuffix(strings.ToLower(path), ".tex") && !strings.HasSuffix(strings.ToLower(path), ".cls")) {
			return nil
		}
		b, rerr := os.ReadFile(path)
		if rerr != nil {
			return nil
		}
		matches := graphicsRe.FindAllStringSubmatch(string(b), -1)
		for _, m := range matches {
			if len(m) >= 2 {
				refs[m[1]] = struct{}{}
			}
		}
		return nil
	})

	for ref := range refs {
		ref = strings.TrimPrefix(ref, "./")
		targetPath := filepath.Join(workspace, ref)
		if _, statErr := os.Stat(targetPath); statErr == nil {
			continue
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			continue
		}

		candidates := []string{ref}
		if job.UserID != "" {
			candidates = append(candidates, filepath.Join(job.UserID, ref))
			candidates = append(candidates, filepath.Join(job.UserID, "assets", filepath.Base(ref)))
		}
		if job.DocID != "" {
			candidates = append(candidates, filepath.Join("project", job.DocID, ref))
			candidates = append(candidates, filepath.Join("project", job.DocID, "assets", filepath.Base(ref)))
		}

		for _, key := range candidates {
			if key == "" {
				continue
			}
			if ferr := minioClient.FGetObject(ctx, "assets", key, targetPath, minio.GetObjectOptions{}); ferr == nil {
				_ = os.Chmod(targetPath, 0644)
				log.Printf(logPrefix+"fetched asset: %s -> %s", key, targetPath)
				break
			}
		}
	}
}

func downloadAndExtractFromMinio(ctx context.Context, minioClient *minio.Client, bucket, object, workspace string) error {
	if bucket == "" || object == "" {
		return fmt.Errorf("missing bucket/object")
	}
	tmpZip := filepath.Join(workspace, "source.zip")
	f, err := os.Create(tmpZip)
	if err != nil {
		return err
	}
	defer f.Close()

	rc, err := minioClient.GetObject(ctx, bucket, object, minio.GetObjectOptions{})
	if err != nil {
		return err
	}
	defer rc.Close()

	if _, err := io.Copy(f, rc); err != nil {
		return err
	}

	r, err := zip.OpenReader(tmpZip)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, zf := range r.File {
		if strings.Contains(zf.Name, "..") || strings.HasPrefix(zf.Name, "/") {
			continue
		}
		targetPath := filepath.Join(workspace, zf.Name)
		if zf.FileInfo().IsDir() {
			_ = os.MkdirAll(targetPath, 0755)
			continue
		}
		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return err
		}
		dst, err := os.Create(targetPath)
		if err != nil {
			return err
		}
		src, err := zf.Open()
		if err != nil {
			dst.Close()
			return err
		}
		if _, err := io.Copy(dst, src); err != nil {
			src.Close()
			dst.Close()
			return err
		}
		src.Close()
		dst.Close()
	}
	return nil
}

func uploadFileToMinio(ctx context.Context, minioClient *minio.Client, bucket, objectName, path string) error {
	exists, err := minioClient.BucketExists(ctx, bucket)
	if err != nil {
		return err
	}
	if !exists {
		if err := minioClient.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return err
		}
	}
	_, err = minioClient.FPutObject(ctx, bucket, objectName, path, minio.PutObjectOptions{})
	return err
}

func runTectonicContainer(ctx context.Context, dockerCli *client.Client, cfg Config, workspace, mainFile string) (string, int, error) {
	// Pull image if needed
	reader, err := dockerCli.ImagePull(ctx, cfg.DockerImage, image.PullOptions{})
	if err == nil && reader != nil {
		io.Copy(io.Discard, reader)
		reader.Close()
	}

	containerName := fmt.Sprintf("tectonic-%d", time.Now().UnixNano())
	cmdStr := fmt.Sprintf("ls -la /workspace && if command -v tectonic >/dev/null 2>&1; then tectonic --outdir=/workspace %s; else latexmk -pdf -f -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape %s; fi", mainFile, mainFile)

	config := &container.Config{
		Image:      cfg.DockerImage,
		Cmd:        []string{"/bin/sh", "-c", cmdStr},
		WorkingDir: "/workspace",
	}

	hostConfig := &container.HostConfig{
		NetworkMode:    "none",
		ReadonlyRootfs: true,
		Tmpfs: map[string]string{
			"/tmp":     "rw",
			"/var/tmp": "rw",
		},
		Mounts: []mount.Mount{
			{
				Type:     mount.TypeBind,
				Source:   workspace,
				Target:   "/workspace",
				ReadOnly: false,
			},
			{
				Type:     mount.TypeVolume,
				Source:   "tectonic-cache",
				Target:   "/var/cache/tectonic",
				ReadOnly: false,
			},
		},
		Resources: container.Resources{
			Memory:   cfg.MemoryBytes,
			NanoCPUs: cfg.NanoCPUs,
		},
	}

	resp, err := dockerCli.ContainerCreate(ctx, config, hostConfig, nil, nil, containerName)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "client version") || strings.Contains(errStr, "API version") || strings.Contains(errStr, "too old") {
			log.Printf("docker API mismatch: %v — falling back to CLI", err)
			return runTectonicContainerDockerCLI(ctx, cfg, workspace, mainFile)
		}
		return "", -1, fmt.Errorf("container create: %w", err)
	}
	containerID := resp.ID

	defer func() {
		timeout := 2
		_ = dockerCli.ContainerRemove(context.Background(), containerID, container.RemoveOptions{
			Force:         true,
			RemoveVolumes: true,
		})
		_ = dockerCli.ContainerStop(context.Background(), containerID, container.StopOptions{
			Timeout: &timeout,
		})
	}()

	if err := dockerCli.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return "", -1, fmt.Errorf("container start: %w", err)
	}

	statusCh, errCh := dockerCli.ContainerWait(ctx, containerID, container.WaitConditionNotRunning)
	var exitCode int64
	select {
	case err := <-errCh:
		if err != nil {
			logs, _ := readContainerLogs(ctx, dockerCli, containerID)
			return logs, -1, fmt.Errorf("container wait error: %w", err)
		}
	case status := <-statusCh:
		exitCode = status.StatusCode
	}

	logs, err := readContainerLogs(ctx, dockerCli, containerID)
	if err != nil {
		return "", int(exitCode), fmt.Errorf("collect logs: %w", err)
	}

	return logs, int(exitCode), nil
}

func runTectonicContainerDockerCLI(ctx context.Context, cfg Config, workspace, mainFile string) (string, int, error) {
	args := []string{
		"run", "--rm",
		"-v", fmt.Sprintf("%s:/workspace", workspace),
		"-v", "tectonic-cache:/var/cache/tectonic",
		"--network", "none",
		"--read-only",
		"--tmpfs", "/tmp:rw",
		"--tmpfs", "/var/tmp:rw",
		"-w", "/workspace",
		"--user", fmt.Sprintf("%d:%d", os.Getuid(), os.Getgid()),
	}

	if cfg.MemoryBytes > 0 {
		args = append(args, "--memory", fmt.Sprintf("%d", cfg.MemoryBytes))
	}
	if cfg.NanoCPUs > 0 {
		cpus := float64(cfg.NanoCPUs) / 1e9
		args = append(args, "--cpus", fmt.Sprintf("%g", cpus))
	}

	cmdStr := fmt.Sprintf("ls -la /workspace && if command -v tectonic >/dev/null 2>&1; then tectonic --outdir=/workspace %s; else latexmk -pdf -f -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape %s; fi", mainFile, mainFile)
	args = append(args, "--entrypoint", "/bin/sh", cfg.DockerImage, "-c", cmdStr)

	cmd := exec.CommandContext(ctx, "docker", args...)
	out, err := cmd.CombinedOutput()
	outStr := string(out)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return outStr, -1, fmt.Errorf("docker CLI failed: %w", err)
		}
	}

	return outStr, exitCode, nil
}

func readContainerLogs(ctx context.Context, dockerCli *client.Client, containerID string) (string, error) {
	opts := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Timestamps: false,
		Follow:     false,
	}
	rc, err := dockerCli.ContainerLogs(ctx, containerID, opts)
	if err != nil {
		return "", err
	}
	defer rc.Close()

	var buf bytes.Buffer
	sc := bufio.NewScanner(rc)
	for sc.Scan() {
		buf.WriteString(sc.Text())
		buf.WriteByte('\n')
	}
	if err := sc.Err(); err != nil {
		rc2, _ := dockerCli.ContainerLogs(ctx, containerID, opts)
		if rc2 != nil {
			defer rc2.Close()
			io.Copy(&buf, rc2)
		}
	}

	return buf.String(), nil
}
