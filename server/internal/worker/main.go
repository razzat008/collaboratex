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
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	containertypes "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/go-redis/redis/v8"
	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// NOTE:
// This file now exposes an exported Run(...) function that accepts initialized
// clients (Redis, Mongo, MinIO, Docker). Initialization of those clients should
// happen outside this package (in your server bootstrap). The worker package
// focuses on job processing logic only.
//
// For an example of usage from your server:
//   cfg := loadConfig()
//   // initialize redisClient, mongoClient, minioClient, dockerCli in server
//   ctx := context.Background()
//   go worker.Run(ctx, cfg, redisClient, mongoClient, minioClient, dockerCli)
//

type Config struct {
	RedisAddr      string
	RedisPassword  string
	RedisQueueName string

	MongoURI      string
	MongoDatabase string
	JobCollection string

	MinioEndpoint   string
	MinioAccessKey  string
	MinioSecretKey  string
	MinioUseSSL     bool
	MinioBucketLogs string
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
	SourceBucket string `json:"sourceBucket"` // MinIO bucket with source archive or files
	SourceObject string `json:"sourceObject"` // object name (e.g., zip archive) OR prefix
	MainFile     string `json:"mainFile"`     // entrypoint, e.g., main.tex
}

func loadConfig() Config {
	// Load configuration from environment variables with reasonable defaults.
	getenv := func(key, d string) string {
		if v := os.Getenv(key); v != "" {
			return v
		}
		return d
	}

	memMB := int64(750)
	cpusNano := int64(500000000) // 0.5 CPU in NanoCPUs

	timeout := 60 * time.Second
	if t := getenv("WORKER_TIMEOUT_SEC", ""); t != "" {
		if parsed, err := time.ParseDuration(t + "s"); err == nil {
			timeout = parsed
		}
	}

	return Config{
		RedisAddr:      getenv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:  getenv("REDIS_PASSWORD", ""),
		RedisQueueName: getenv("REDIS_QUEUE", "compile:queue"),

		MongoURI:      getenv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDatabase: getenv("MONGO_DB", "gollaboratex"),
		JobCollection: getenv("MONGO_JOB_COLLECTION", "compile_jobs"),

		MinioEndpoint:   getenv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey:  getenv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey:  getenv("MINIO_SECRET_KEY", "minioadmin"),
		MinioUseSSL:     getenv("MINIO_USE_SSL", "") == "true",
		MinioBucketLogs: getenv("MINIO_BUCKET_LOGS", "compile-logs"),
		MinioBucketPDFs: getenv("MINIO_BUCKET_PDFS", "compiled-pdfs"),

		DockerImage: getenv("TEXLIVE_IMAGE", "texlive-compiler:latest"),

		MemoryBytes: memMB << 20,
		NanoCPUs:    cpusNano,
		Timeout:     timeout,
	}
}

// Run starts the worker main loop. All clients must be already initialized by the caller.
// The function returns when ctx is canceled or on fatal error.
func Run(ctx context.Context, cfg Config, redisClient *redis.Client, mongoClient *mongo.Client, minioClient *minio.Client, dockerCli *client.Client) error {
	if ctx == nil {
		ctx = context.Background()
	}

	jobColl := mongoClient.Database(cfg.MongoDatabase).Collection(cfg.JobCollection)

	log.Printf("worker started (docker image=%s, redis=%s, mongo=%s, minio=%s)",
		cfg.DockerImage, cfg.RedisAddr, cfg.MongoURI, cfg.MinioEndpoint)

	// Main loop: BLPOP from Redis queue
	for {
		select {
		case <-ctx.Done():
			log.Println("context canceled, exiting main loop")
			return ctx.Err()
		default:
		}

		// Blocking pop with timeout so we can react to ctx.Done
		res, err := redisClient.BLPop(ctx, 5*time.Second, cfg.RedisQueueName).Result()
		if err != nil {
			// Handle cancellation/timeouts and continue
			if err == context.Canceled || err == context.DeadlineExceeded {
				continue
			}
			// go-redis returns redis.Nil for empty result; treat as timeout
			// Try to detect redis.Nil by string comparison to avoid importing redis here.
			// If redis.Nil is returned as error type, callers will see it; we simply continue on non-fatal errors.
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

		// Process job in a separate goroutine so main loop can continue.
		// In production, add concurrency limiting.
		go func(j JobPayload) {
			ctxJob, cancelJob := context.WithTimeout(ctx, cfg.Timeout+30*time.Second)
			defer cancelJob()
			if err := processJob(ctxJob, j, cfg, dockerCli, minioClient, jobColl); err != nil {
				log.Printf("job %s failed: %v", j.JobID, err)
			} else {
				log.Printf("job %s finished successfully", j.JobID)
			}
		}(job)
	}
}

// The rest of the helper functions are unchanged; they operate the same as before.

// processJob handles the complete lifecycle for a single compile job.
func processJob(ctx context.Context, job JobPayload, cfg Config, dockerCli *client.Client, minioClient *minio.Client, jobColl *mongo.Collection) error {
	start := time.Now()
	logPrefix := fmt.Sprintf("[job=%s] ", job.JobID)
	log.Printf(logPrefix + "starting")

	// Update job status to running in Mongo (best-effort)
	_ = updateJobStatus(ctx, jobColl, job.JobID, "running", "", "")

	// Create workspace
	workspace, err := os.MkdirTemp("", "compile-"+job.JobID+"-")
	if err != nil {
		_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", "workspace creation failed")
		return fmt.Errorf("create workspace: %w", err)
	}
	defer func() {
		_ = os.RemoveAll(workspace)
	}()

	// Download sources from MinIO. Here we assume SourceObject is a zip archive.
	if err := downloadAndExtractFromMinio(ctx, minioClient, job.SourceBucket, job.SourceObject, workspace); err != nil {
		_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", "failed to fetch source")
		return fmt.Errorf("download sources: %w", err)
	}

	// Determine main file candidates and try several possibilities:
	// - the job.MainFile as provided (with and without .tex)
	// - fallback to "main.tex"
	//
	// To be more robust, search the workspace recursively and log the list of
	// extracted files for debugging. If a candidate is found anywhere in the
	// tree, use that path (relative to workspace). If no explicit candidate is
	// found but exactly one .tex file exists, use that as a heuristic.
	requested := job.MainFile
	if requested == "" {
		requested = "main"
	}

	candidates := []string{}
	seen := make(map[string]bool)
	addCandidate := func(name string) {
		if name == "" {
			return
		}
		if !seen[name] {
			candidates = append(candidates, name)
			seen[name] = true
		}
	}

	// Add the raw requested name and variants
	addCandidate(requested)
	if filepath.Ext(requested) == "" {
		addCandidate(requested + ".tex")
	} else {
		base := strings.TrimSuffix(requested, filepath.Ext(requested))
		addCandidate(base)
		addCandidate(base + ".tex")
	}
	addCandidate("main.tex")

	// Walk the workspace recursively to collect extracted files and try to match candidates.
	var extracted []string
	var mainFile string
	found := false
	var walkErr error

	walkErr = filepath.WalkDir(workspace, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// propagate unexpected walk errors
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(workspace, path)
		extracted = append(extracted, rel)

		// Try to match any candidate with the relative path or basename
		for _, c := range candidates {
			if rel == c || filepath.Base(rel) == c {
				mainFile = rel
				// Use sentinel error to short-circuit the walk
				return errors.New("__FOUND_MAIN__")
			}
		}
		return nil
	})

	// Log the list of extracted files for debugging (helps diagnose missing main.tex)
	log.Printf(logPrefix+"extracted files: %v", extracted)

	// If walk returned our sentinel, treat as found
	if walkErr != nil && walkErr.Error() == "__FOUND_MAIN__" {
		found = true
	} else if walkErr != nil {
		// If there was a real error walking, log it but continue to heuristics
		log.Printf(logPrefix+"warning: failed to walk workspace: %v", walkErr)
	}

	// Heuristic: if no explicit candidate found, but exactly one .tex file exists, use it.
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
		_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", "main file missing")
		return fmt.Errorf("main file missing: tried candidates %v; extracted files: %v", candidates, extracted)
	}

	// Run docker container with the tectonic image
	stdoutStderr, exitCode, err := runTectonicContainer(ctx, dockerCli, cfg, workspace, mainFile)
	// capture logs (we'll upload the logs even on success)
	logObjectName := fmt.Sprintf("%s.log", job.JobID)
	logPath := filepath.Join(workspace, logObjectName)
	if writeErr := os.WriteFile(logPath, []byte(stdoutStderr), 0644); writeErr != nil {
		log.Printf(logPrefix+"failed to write log file: %v", writeErr)
	}

	// Upload logs
	if upErr := uploadFileToMinio(ctx, minioClient, cfg.MinioBucketLogs, logObjectName, logPath); upErr != nil {
		log.Printf(logPrefix+"warning: failed to upload logs: %v", upErr)
	} else {
		// Read log contents and store them directly on the job document in Mongo so the frontend
		// can show logs inline without always fetching MinIO objects. This is best-effort.
		if b, rerr := os.ReadFile(logPath); rerr == nil {
			// store log text under `logs` field (string) for quick visibility
			_, _ = jobColl.UpdateOne(ctx, bson.M{"jobId": job.JobID}, bson.M{
				"$set": bson.M{
					"logs": string(b),
				},
			})
		} else {
			log.Printf(logPrefix+"warning: failed to read log file for embedding: %v", rerr)
		}
	}

	if err != nil || exitCode != 0 {
		// If the container exited non-zero, check whether the expected PDF was
		// nevertheless produced. Some transient write errors (e.g. attempts to
		// write outside writable mounts) can cause a non-zero exit even though
		// the final PDF exists in /workspace. Prefer success if the PDF exists.
		pdfName := strings.TrimSuffix(mainFile, filepath.Ext(mainFile)) + ".pdf"
		pdfPath := filepath.Join(workspace, pdfName)
		if _, statErr := os.Stat(pdfPath); statErr == nil {
			log.Printf(logPrefix+"warning: container exited with code=%d but PDF %s exists; continuing", exitCode, pdfName)
		} else {
			_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", fmt.Sprintf("compile failed (exit=%d) %v", exitCode, err))
			if err != nil {
				return fmt.Errorf("compile failed: exit=%d err=%w", exitCode, err)
			}
			return fmt.Errorf("compile failed: exit=%d", exitCode)
		}
	}

	// Find produced PDF (assume same base name with .pdf)
	pdfName := strings.TrimSuffix(mainFile, filepath.Ext(mainFile)) + ".pdf"
	pdfPath := filepath.Join(workspace, pdfName)
	if _, err := os.Stat(pdfPath); err != nil {
		_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", "pdf not found after compile")
		return fmt.Errorf("pdf not found: %w", err)
	}

	// Upload PDF to MinIO
	pdfObject := fmt.Sprintf("%s.pdf", job.JobID)
	if err := uploadFileToMinio(ctx, minioClient, cfg.MinioBucketPDFs, pdfObject, pdfPath); err != nil {
		_ = updateJobStatus(ctx, jobColl, job.JobID, "failed", "", "failed to upload pdf")
		return fmt.Errorf("upload pdf: %w", err)
	}

	// Update job to success and store references.
	// Generate presigned URLs for the PDF and logs so the frontend can download them directly.
	// Fall back to a minio:// placeholder if presigning fails.
	expire := time.Hour
	var pdfURL, logURL string

	if u, err := minioClient.PresignedGetObject(ctx, cfg.MinioBucketPDFs, pdfObject, expire, nil); err == nil && u != nil {
		pdfURL = u.String()
	} else {
		log.Printf("[job=%s] warning: failed to presign PDF URL: %v", job.JobID, err)
		pdfURL = fmt.Sprintf("minio://%s/%s", cfg.MinioBucketPDFs, pdfObject)
	}

	if u, err := minioClient.PresignedGetObject(ctx, cfg.MinioBucketLogs, logObjectName, expire, nil); err == nil && u != nil {
		logURL = u.String()
	} else {
		log.Printf("[job=%s] warning: failed to presign Log URL: %v", job.JobID, err)
		logURL = fmt.Sprintf("minio://%s/%s", cfg.MinioBucketLogs, logObjectName)
	}

	_ = updateJobStatus(ctx, jobColl, job.JobID, "success", pdfURL, logURL)

	log.Printf(logPrefix+"completed in %s", time.Since(start))
	return nil
}

func updateJobStatus(ctx context.Context, coll *mongo.Collection, jobID, status, pdfURL, logURL string) error {
	if jobID == "" {
		return nil
	}
	filter := bson.M{"jobId": jobID}
	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"finishedAt": time.Now(),
		},
	}
	if pdfURL != "" {
		update["$set"].(bson.M)["outputPdfUrl"] = pdfURL
	}
	if logURL != "" {
		update["$set"].(bson.M)["logUrl"] = logURL
	}
	_, err := coll.UpdateOne(ctx, filter, update)
	return err
}

// downloadAndExtractFromMinio downloads a zip archive from MinIO and extracts it into workspace.
// This is a simple helper that assumes SourceObject is a zip file. You can replace this with
// logic that downloads many objects or an archive format you prefer.
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

	// extract zip
	r, err := zip.OpenReader(tmpZip)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, zf := range r.File {
		// sanitize path
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
	// Ensure bucket exists
	exists, err := minioClient.BucketExists(ctx, bucket)
	if err != nil {
		return err
	}
	if !exists {
		if err := minioClient.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return err
		}
	}

	// upload file
	_, err = minioClient.FPutObject(ctx, bucket, objectName, path, minio.PutObjectOptions{})
	return err
}

// runTectonicContainer runs the configured tectonic docker image with mounts and resource limits.
// Returns combined stdout+stderr and exit code.
func runTectonicContainer(ctx context.Context, dockerCli *client.Client, cfg Config, workspace, mainFile string) (string, int, error) {
	// First try to use the Docker API client (preferred).
	reader, err := dockerCli.ImagePull(ctx, cfg.DockerImage, types.ImagePullOptions{})
	if err == nil && reader != nil {
		// drain the reader to completion to avoid blocking
		io.Copy(io.Discard, reader)
		reader.Close()
	}

	// Configure container (API path)
	containerName := fmt.Sprintf("tectonic-%d", time.Now().UnixNano())
	cmdStr := fmt.Sprintf("ls -la /workspace && if command -v tectonic >/dev/null 2>&1; then tectonic --outdir=/workspace %s; else latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape %s; fi", mainFile, mainFile)
	config := &containertypes.Config{
		Image: cfg.DockerImage,
		Cmd:   []string{"/bin/sh", "-c", cmdStr},
		// It's important not to run as root inside image; our image sets USER tectonic.
		WorkingDir: "/workspace",
	}

	hostConfig := &containertypes.HostConfig{
		NetworkMode:    "none",
		ReadonlyRootfs: true,
		// Provide writable tmpfs mounts for /tmp and /var/tmp so Tectonic and
		// libraries can write transient files even with a read-only rootfs.
		Tmpfs: map[string]string{
			"/tmp":     "rw",
			"/var/tmp": "rw",
		},
		Mounts: []mount.Mount{
			{
				Type:   mount.TypeBind,
				Source: workspace,
				Target: "/workspace",
				// workspace must be writable
				ReadOnly: false,
			},
			{
				Type:     mount.TypeVolume,
				Source:   "tectonic-cache",
				Target:   "/var/cache/tectonic",
				ReadOnly: false,
			},
		},
		Resources: containertypes.Resources{
			Memory:   cfg.MemoryBytes,
			NanoCPUs: cfg.NanoCPUs,
		},
	}

	resp, err := dockerCli.ContainerCreate(ctx, config, hostConfig, nil, nil, containerName)
	if err != nil {
		// If the API client is incompatible (old client vs newer daemon), fall back to using the docker CLI.
		errStr := err.Error()
		if strings.Contains(errStr, "client version") || strings.Contains(errStr, "API version") || strings.Contains(errStr, "too old") {
			log.Printf("docker client API mismatch detected: %v — falling back to docker CLI", err)
			return runTectonicContainerDockerCLI(ctx, cfg, workspace, mainFile)
		}
		return "", -1, fmt.Errorf("container create: %w", err)
	}
	containerID := resp.ID

	defer func() {
		timeout := 2 * time.Second
		_ = dockerCli.ContainerRemove(context.Background(), containerID, types.ContainerRemoveOptions{Force: true, RemoveVolumes: true})
		_ = dockerCli.ContainerStop(context.Background(), containerID, &timeout)
	}()

	// Start container
	if err := dockerCli.ContainerStart(ctx, containerID, types.ContainerStartOptions{}); err != nil {
		return "", -1, fmt.Errorf("container start: %w", err)
	}

	// Wait for container to stop
	statusCh, errCh := dockerCli.ContainerWait(ctx, containerID, containertypes.WaitConditionNotRunning)
	var exitCode int64
	select {
	case err := <-errCh:
		if err != nil {
			// retrieve logs for debugging
			logs, _ := readContainerLogs(ctx, dockerCli, containerID)
			return logs, -1, fmt.Errorf("container wait error: %w", err)
		}
	case status := <-statusCh:
		exitCode = status.StatusCode
	}

	// Collect logs
	logs, err := readContainerLogs(ctx, dockerCli, containerID)
	if err != nil {
		return "", int(exitCode), fmt.Errorf("collect logs: %w", err)
	}

	return logs, int(exitCode), nil
}

// runTectonicContainerDockerCLI executes the tectonic image using the local `docker` CLI as a fallback.
// It shells out to `docker run` mounting the workspace and the tectonic cache volume and returns combined output and exit code.
// If docker CLI fails to start the container (e.g., exit code 125 or permission errors), we attempt a local-host fallback:
// run `tectonic` or `latexmk` directly on the host workspace. This helps in environments where Docker is unavailable
// to the worker process but a local TeX toolchain exists.
func runTectonicContainerDockerCLI(ctx context.Context, cfg Config, workspace, mainFile string) (string, int, error) {
	// Build docker arguments
	args := []string{
		"run", "--rm",
		"-v", fmt.Sprintf("%s:/workspace", workspace),
		"-v", "tectonic-cache:/var/cache/tectonic",
		"--network", "none",
		"--read-only",
		// Provide writable tmpfs for processes that write to /tmp or /var/tmp
		"--tmpfs", "/tmp:rw",
		"--tmpfs", "/var/tmp:rw",
		"-w", "/workspace",
	}

	// Map the container user to the host UID:GID so bind-mounted files are readable by the container.
	// This helps avoid "failed to open input file 'main.tex'" errors caused by permission mismatches.
	uid := os.Getuid()
	gid := os.Getgid()
	args = append(args, "--user", fmt.Sprintf("%d:%d", uid, gid))

	// Apply memory/cpu limits if provided
	if cfg.MemoryBytes > 0 {
		args = append(args, "--memory", fmt.Sprintf("%d", cfg.MemoryBytes))
	}
	if cfg.NanoCPUs > 0 {
		// --cpus expects a decimal like 0.5
		cpus := float64(cfg.NanoCPUs) / 1e9
		args = append(args, "--cpus", fmt.Sprintf("%g", cpus))
	}

	// Image and command:
	// Use a shell entrypoint that first lists the workspace (debugging aid) and then runs tectonic or latexmk.
	// The listing will be captured in the combined output/logs.
	cmdStr := fmt.Sprintf("ls -la /workspace && if command -v tectonic >/dev/null 2>&1; then tectonic --outdir=/workspace %s; else latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape %s; fi", mainFile, mainFile)
	args = append(args, "--entrypoint", "/bin/sh", cfg.DockerImage, "-c", cmdStr)

	// Use the provided context (which may include timeouts)
	cmd := exec.CommandContext(ctx, "docker", args...)
	// capture combined output
	out, err := cmd.CombinedOutput()
	outStr := string(out)

	// Extract exit code
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			// Non-exit error (e.g., docker not installed / permission)
			// Before returning, attempt local-host fallback to run tectonic/latexmk directly.
			localCmdStr := fmt.Sprintf("ls -la %s && (command -v tectonic >/dev/null 2>&1 && tectonic --outdir=%s %s || latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error -outdir=%s %s)", workspace, workspace, mainFile, workspace, mainFile)
			localCmd := exec.CommandContext(ctx, "/bin/sh", "-c", localCmdStr)
			localOut, localErr := localCmd.CombinedOutput()
			localOutStr := string(localOut)

			if localErr != nil {
				// Return both docker error and local attempt output to make debugging easier.
				return outStr + "\n\n=== LOCAL FALLBACK ATTEMPT OUTPUT ===\n" + localOutStr, -1, fmt.Errorf("docker CLI execution failed: %w (output: %s); local fallback error: %v", err, outStr, localErr)
			}
			// Local fallback succeeded — treat as success (exit 0) if PDF exists.
			return localOutStr, 0, nil
		}
	}

	// If docker returned a non-zero exit code, attempt local-host fallback (common cases: exit=125, permission issues).
	if exitCode != 0 {
		// Try local fallback only if we can run shell commands locally.
		localCmdStr := fmt.Sprintf("ls -la %s && (command -v tectonic >/dev/null 2>&1 && tectonic --outdir=%s %s || latexmk -pdf -interaction=nonstopmode -halt-on-error -file-line-error -outdir=%s %s) && ls -la %s", workspace, workspace, mainFile, workspace, mainFile, workspace)
		localCmd := exec.CommandContext(ctx, "/bin/sh", "-c", localCmdStr)
		localOut, localErr := localCmd.CombinedOutput()
		localOutStr := string(localOut)

		if localErr == nil {
			// local fallback succeeded — return its output as the canonical logs and indicate success.
			return localOutStr, 0, nil
		}

		// local fallback failed as well; return combined docker + local outputs for debugging.
		combined := outStr + "\n\n=== LOCAL FALLBACK ATTEMPT OUTPUT ===\n" + localOutStr
		// Try to extract a meaningful exit code from the localErr if it's an ExitError.
		localExit := -1
		if le, ok := localErr.(*exec.ExitError); ok {
			localExit = le.ExitCode()
		}
		// prefer docker exit code as primary error code if it indicates docker CLI failure
		return combined, exitCode, fmt.Errorf("docker run failed with exit=%d and local fallback failed (exit=%d): docker_err=%v local_err=%v", exitCode, localExit, err, localErr)
	}

	return outStr, exitCode, nil
}

func readContainerLogs(ctx context.Context, dockerCli *client.Client, containerID string) (string, error) {
	opts := types.ContainerLogsOptions{
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
	// Docker multiplexes stdout/stderr in a single stream that has a header when using the API.
	// Using bufio to copy is simplest for logs we will store.
	sc := bufio.NewScanner(rc)
	for sc.Scan() {
		buf.WriteString(sc.Text())
		buf.WriteByte('\n')
	}
	if err := sc.Err(); err != nil {
		// fallback to generic copy
		rc2, _ := dockerCli.ContainerLogs(ctx, containerID, opts)
		defer func() {
			if rc2 != nil {
				rc2.Close()
			}
		}()
		io.Copy(&buf, rc2)
	}

	return buf.String(), nil
}
