package worker

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// CompileJob represents the Mongo document for a compile job.
type CompileJob struct {
	JobID        string    `bson:"jobId" json:"jobId"`
	UserID       string    `bson:"userId,omitempty" json:"userId,omitempty"`
	DocID        string    `bson:"docId,omitempty" json:"docId,omitempty"`
	SourceBucket string    `bson:"sourceBucket" json:"sourceBucket"`
	SourceObject string    `bson:"sourceObject" json:"sourceObject"`
	MainFile     string    `bson:"mainFile" json:"mainFile"`
	Status       string    `bson:"status" json:"status"`
	CreatedAt    time.Time `bson:"createdAt" json:"createdAt"`
	StartedAt    time.Time `bson:"startedAt,omitempty" json:"startedAt,omitempty"`
	FinishedAt   time.Time `bson:"finishedAt,omitempty" json:"finishedAt,omitempty"`
	OutputPdfUrl string    `bson:"outputPdfUrl,omitempty" json:"outputPdfUrl,omitempty"`
	LogUrl       string    `bson:"logUrl,omitempty" json:"logUrl,omitempty"`
	ErrorMessage string    `bson:"errorMessage,omitempty" json:"errorMessage,omitempty"`
	Attempts     int       `bson:"attempts,omitempty" json:"attempts,omitempty"`
	MaxAttempts  int       `bson:"maxAttempts,omitempty" json:"maxAttempts,omitempty"`
	CompiledHash string    `bson:"compiledHash,omitempty" json:"compiledHash,omitempty"`
}

// Handler exposes HTTP handlers for compile jobs.
type Handler struct {
	Redis     *redis.Client
	Minio     *minio.Client
	JobColl   *mongo.Collection
	QueueName string

	LogsBucket string
	PdfsBucket string
}

// NewHandler creates a new Handler instance.
func NewHandler(r *redis.Client, m *minio.Client, jc *mongo.Collection, queueName, logsBucket, pdfsBucket string) *Handler {
	return &Handler{
		Redis:      r,
		Minio:      m,
		JobColl:    jc,
		QueueName:  queueName,
		LogsBucket: logsBucket,
		PdfsBucket: pdfsBucket,
	}
}

// RegisterRoutes attaches routes to the provided Gin router group.
//
// Example:
//
//	h := worker.NewHandler(redisClient, minioClient, jobCollection, "compile:queue", "compile-logs", "compiled-pdfs")
//	apiGroup := r.Group("/api")
//	h.RegisterRoutes(apiGroup)
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/compile", h.EnqueueCompile)
	// Inline compile accepts files (name + content) in JSON, zips them server-side and enqueues a compile job.
	rg.POST("/compile-inline", h.EnqueueCompileInline)
	rg.GET("/compile/:id", h.GetJobStatus)
}

// enqueueRequest is the expected JSON body for enqueueing a compile.
type enqueueRequest struct {
	DocID        string `json:"docId,omitempty"`
	SourceBucket string `json:"sourceBucket" binding:"required"`
	SourceObject string `json:"sourceObject" binding:"required"`
	MainFile     string `json:"mainFile" binding:"required"`
}

// EnqueueCompile creates a job document in Mongo and pushes a job payload to Redis.
func (h *Handler) EnqueueCompile(c *gin.Context) {
	var req enqueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload", "details": err.Error()})
		return
	}

	// Try to get user id from context (middleware may set it); optional.
	userID := ""
	if v, exists := c.Get("userId"); exists {
		if s, ok := v.(string); ok {
			userID = s
		}
	}
	// Fallback to header if middleware not present
	if userID == "" {
		userID = c.GetHeader("X-User-Id")
	}

	jobID := uuid.New().String()
	now := time.Now().UTC()

	job := CompileJob{
		JobID:        jobID,
		UserID:       userID,
		DocID:        req.DocID,
		SourceBucket: req.SourceBucket,
		SourceObject: req.SourceObject,
		MainFile:     req.MainFile,
		Status:       "queued",
		CreatedAt:    now,
		MaxAttempts:  3,
		Attempts:     0,
	}

	// Insert into Mongo (best-effort; return error if fails)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if _, err := h.JobColl.InsertOne(ctx, job); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create job", "details": err.Error()})
		return
	}

	// Prepare payload for Redis queue
	payload := map[string]interface{}{
		"jobId":        job.JobID,
		"userId":       job.UserID,
		"sourceBucket": job.SourceBucket,
		"sourceObject": job.SourceObject,
		"mainFile":     job.MainFile,
		"docId":        job.DocID,
	}

	b, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal job payload", "details": err.Error()})
		return
	}

	// Push to Redis queue
	if err := h.Redis.RPush(ctx, h.QueueName, string(b)).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue job", "details": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"jobId":  jobID,
		"status": "queued",
	})
}

// GetJobStatus returns the job document stored in Mongo for the given job id.
//
// EnqueueCompileInline handles an inline compile request.
// Expects JSON:
//
//	{
//	  "files": [{"name":"main.tex","content":"..."}],
//	  "mainFile":"main.tex",
//	  "docId":"optional"
//	}
//
// It zips the provided files in-memory, uploads to MinIO under bucket "compile-sources"
// and then creates & enqueues a job (same flow as EnqueueCompile).
func (h *Handler) EnqueueCompileInline(c *gin.Context) {
	type InlineFile struct {
		Name    string `json:"name" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	type InlineRequest struct {
		Files    []InlineFile `json:"files" binding:"required"`
		MainFile string       `json:"mainFile" binding:"required"`
		DocID    string       `json:"docId,omitempty"`
	}

	var req InlineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload", "details": err.Error()})
		return
	}
	if len(req.Files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files provided"})
		return
	}

	// derive user id if available from context
	userID := ""
	if v, exists := c.Get("userId"); exists {
		if s, ok := v.(string); ok {
			userID = s
		}
	}
	if userID == "" {
		userID = c.GetHeader("X-User-Id")
	}

	jobID := uuid.New().String()
	now := time.Now().UTC()

	// Create in-memory ZIP
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, f := range req.Files {
		// sanitize filename a little
		name := f.Name
		if name == "" {
			zw.Close()
			c.JSON(http.StatusBadRequest, gin.H{"error": "file name required for each entry"})
			return
		}
		w, err := zw.Create(name)
		if err != nil {
			zw.Close()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create zip entry", "details": err.Error()})
			return
		}
		if _, err := io.Copy(w, bytes.NewReader([]byte(f.Content))); err != nil {
			zw.Close()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write zip entry", "details": err.Error()})
			return
		}
	}
	if err := zw.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to finalize zip", "details": err.Error()})
		return
	}

	// Ensure compile-sources bucket exists
	sourcesBucket := "compile-sources"
	ctx := c.Request.Context()
	exists, err := h.Minio.BucketExists(ctx, sourcesBucket)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "minio bucket check failed", "details": err.Error()})
		return
	}
	if !exists {
		if err := h.Minio.MakeBucket(ctx, sourcesBucket, minio.MakeBucketOptions{}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create sources bucket", "details": err.Error()})
			return
		}
	}

	objectName := fmt.Sprintf("inline/%s.zip", jobID)
	// Upload zip to MinIO
	_, err = h.Minio.PutObject(ctx, sourcesBucket, objectName, bytes.NewReader(buf.Bytes()), int64(buf.Len()), minio.PutObjectOptions{ContentType: "application/zip"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload source zip", "details": err.Error()})
		return
	}

	// Create job document
	job := CompileJob{
		JobID:        jobID,
		UserID:       userID,
		DocID:        req.DocID,
		SourceBucket: sourcesBucket,
		SourceObject: objectName,
		MainFile:     req.MainFile,
		Status:       "queued",
		CreatedAt:    now,
		MaxAttempts:  3,
		Attempts:     0,
	}

	// Insert into Mongo
	insertCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if _, err := h.JobColl.InsertOne(insertCtx, job); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create job", "details": err.Error()})
		return
	}

	// Push to Redis queue
	payload := map[string]interface{}{
		"jobId":        job.JobID,
		"userId":       job.UserID,
		"sourceBucket": job.SourceBucket,
		"sourceObject": job.SourceObject,
		"mainFile":     job.MainFile,
		"docId":        job.DocID,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal job payload", "details": err.Error()})
		return
	}
	if err := h.Redis.RPush(insertCtx, h.QueueName, string(b)).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue job", "details": err.Error()})
		return
	}

	// Debug logging: record enqueued inline job and basic metadata for easier diagnosis.
	log.Printf("[compile_enqueue] inline job enqueued: jobId=%s source=%s/%s files=%d docId=%s", jobID, sourcesBucket, objectName, len(req.Files), req.DocID)

	// Build lightweight file metadata to return to caller (name + size bytes).
	filesMeta := make([]map[string]interface{}, 0, len(req.Files))
	for _, f := range req.Files {
		filesMeta = append(filesMeta, map[string]interface{}{
			"name": f.Name,
			"size": len(f.Content),
		})
	}

	c.JSON(http.StatusAccepted, gin.H{
		"jobId":        jobID,
		"status":       "queued",
		"sourceBucket": sourcesBucket,
		"sourceObject": objectName,
		"files":        filesMeta,
	})
}

// GetJobStatus returns the job document stored in Mongo for the given job id.
func (h *Handler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing job id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var job CompileJob
	err := h.JobColl.FindOne(ctx, bson.M{"jobId": jobID}).Decode(&job)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch job", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}
