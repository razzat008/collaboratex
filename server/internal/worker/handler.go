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
	"go.mongodb.org/mongo-driver/v2/mongo"
)

const (
	// Redis key prefixes
	redisLogPrefix    = "compile:log:"
	redisStatusPrefix = "compile:status:"
	// TTL for logs in Redis (24 hours)
	logTTL = 24 * time.Hour
	// TTL for status in Redis (1 hour)
	statusTTL = 1 * time.Hour
)

// CompileStatus represents the minimal status info stored in Redis
type CompileStatus struct {
	JobID      string    `bson:"jobId"`
	Status     string    `bson:"status"` // queued, running, success, failed
	CreatedAt  time.Time `bson:"createdAt"`
	FinishedAt time.Time `bson:"finishedAt,omitempty"`
	Error      string    `bson:"error,omitempty"`
	PdfURL     string    `bson:"pdfUrl,omitempty"`
}

// CompileJob represents the Mongo document for a compile job (minimal, for historical tracking only)
type CompileJob struct {
	JobID     string    `bson:"jobId" json:"jobId"`
	UserID    string    `bson:"userId,omitempty" json:"userId,omitempty"`
	DocID     string    `bson:"docId,omitempty" json:"docId,omitempty"`
	Status    string    `bson:"status" json:"status"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

// Handler exposes HTTP handlers for compile jobs.
type Handler struct {
	Redis      *redis.Client
	Minio      *minio.Client
	JobColl    *mongo.Collection // Optional: for historical tracking only
	QueueName  string
	PdfsBucket string
}

// NewHandler creates a new Handler instance.
func NewHandler(r *redis.Client, m *minio.Client, jc *mongo.Collection, queueName, pdfsBucket string) *Handler {
	return &Handler{
		Redis:      r,
		Minio:      m,
		JobColl:    jc,
		QueueName:  queueName,
		PdfsBucket: pdfsBucket,
	}
}

// enqueueRequest is the expected JSON body for enqueueing a compile.
type enqueueRequest struct {
	DocID        string `json:"docId,omitempty"`
	SourceBucket string `json:"sourceBucket" binding:"required"`
	SourceObject string `json:"sourceObject" binding:"required"`
	MainFile     string `json:"mainFile" binding:"required"`
}

// EnqueueCompile creates a job and pushes it to Redis queue.
func (h *Handler) EnqueueCompile(c *gin.Context) {
	var req enqueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload", "details": err.Error()})
		return
	}

	userID := h.extractUserID(c)
	jobID := uuid.New().String()
	now := time.Now().UTC()

	// Store initial status in Redis
	status := CompileStatus{
		JobID:     jobID,
		Status:    "queued",
		CreatedAt: now,
	}
	if err := h.setStatus(c.Request.Context(), jobID, status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store status", "details": err.Error()})
		return
	}

	// Optional: Store minimal record in MongoDB for historical tracking
	if h.JobColl != nil {
		job := CompileJob{
			JobID:     jobID,
			UserID:    userID,
			DocID:     req.DocID,
			Status:    "queued",
			CreatedAt: now,
		}
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = h.JobColl.InsertOne(ctx, job) // Best effort, don't fail if Mongo is down
	}

	// Prepare payload for Redis queue
	payload := map[string]interface{}{
		"jobId":        jobID,
		"userId":       userID,
		"sourceBucket": req.SourceBucket,
		"sourceObject": req.SourceObject,
		"mainFile":     req.MainFile,
		"docId":        req.DocID,
	}

	b, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal job payload", "details": err.Error()})
		return
	}

	// Push to Redis queue
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := h.Redis.RPush(ctx, h.QueueName, string(b)).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue job", "details": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"jobId":  jobID,
		"status": "queued",
	})
}

// EnqueueCompileInline handles inline compile with files sent as JSON
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

	userID := h.extractUserID(c)
	jobID := uuid.New().String()
	now := time.Now().UTC()

	// Create in-memory ZIP
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, f := range req.Files {
		if f.Name == "" {
			zw.Close()
			c.JSON(http.StatusBadRequest, gin.H{"error": "file name required for each entry"})
			return
		}
		w, err := zw.Create(f.Name)
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

	// Upload to MinIO
	sourcesBucket := "compile-sources"
	ctx := c.Request.Context()
	objectName := fmt.Sprintf("inline/%s.zip", jobID)
	_, err := h.Minio.PutObject(ctx, sourcesBucket, objectName, bytes.NewReader(buf.Bytes()), int64(buf.Len()), minio.PutObjectOptions{ContentType: "application/zip"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload source zip", "details": err.Error()})
		return
	}

	// Store initial status in Redis
	status := CompileStatus{
		JobID:     jobID,
		Status:    "queued",
		CreatedAt: now,
	}
	if err := h.setStatus(ctx, jobID, status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store status", "details": err.Error()})
		return
	}

	// Optional: Store in MongoDB
	if h.JobColl != nil {
		job := CompileJob{
			JobID:     jobID,
			UserID:    userID,
			DocID:     req.DocID,
			Status:    "queued",
			CreatedAt: now,
		}
		insertCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = h.JobColl.InsertOne(insertCtx, job)
	}

	// Enqueue job
	payload := map[string]interface{}{
		"jobId":        jobID,
		"userId":       userID,
		"sourceBucket": sourcesBucket,
		"sourceObject": objectName,
		"mainFile":     req.MainFile,
		"docId":        req.DocID,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal job payload", "details": err.Error()})
		return
	}

	queueCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := h.Redis.RPush(queueCtx, h.QueueName, string(b)).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue job", "details": err.Error()})
		return
	}

	log.Printf("[compile_enqueue] inline job enqueued: jobId=%s files=%d", jobID, len(req.Files))

	c.JSON(http.StatusAccepted, gin.H{
		"jobId":        jobID,
		"status":       "queued",
		"sourceBucket": sourcesBucket,
		"sourceObject": objectName,
	})
}

// GetJobStatus returns the job status and logs from Redis
func (h *Handler) GetJobStatus(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing job id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get status from Redis
	status, err := h.getStatus(ctx, jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	// Get logs from Redis if available
	logs, _ := h.getLogs(ctx, jobID)

	response := gin.H{
		"jobId":      status.JobID,
		"status":     status.Status,
		"createdAt":  status.CreatedAt,
		"finishedAt": status.FinishedAt,
	}

	if logs != "" {
		response["logs"] = logs
	}
	if status.Error != "" {
		response["error"] = status.Error
	}
	if status.PdfURL != "" {
		response["pdfUrl"] = status.PdfURL
	}

	c.JSON(http.StatusOK, response)
}

// GetJobLogs returns only the compilation logs (streaming-friendly)
func (h *Handler) GetJobLogs(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing job id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	logs, err := h.getLogs(ctx, jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "logs not found"})
		return
	}

	c.String(http.StatusOK, logs)
}

// DownloadPDF serves the compiled PDF directly
func (h *Handler) DownloadPDF(c *gin.Context) {
	jobID := c.Param("id")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing job id"})
		return
	}

	ctx := c.Request.Context()

	// Get PDF from MinIO
	objectName := fmt.Sprintf("%s.pdf", jobID)
	obj, err := h.Minio.GetObject(ctx, h.PdfsBucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "pdf not found"})
		return
	}
	defer obj.Close()

	// Get object info for content length
	stat, err := obj.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get pdf info"})
		return
	}

	// Set headers for PDF download
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.pdf"`, jobID))
	c.Header("Content-Length", fmt.Sprintf("%d", stat.Size))

	// Stream PDF to response
	if _, err := io.Copy(c.Writer, obj); err != nil {
		log.Printf("Error streaming PDF: %v", err)
	}
}

// Helper methods

func (h *Handler) extractUserID(c *gin.Context) string {
	if v, exists := c.Get("userId"); exists {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return c.GetHeader("X-User-Id")
}

func (h *Handler) setStatus(ctx context.Context, jobID string, status CompileStatus) error {
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}
	return h.Redis.Set(ctx, redisStatusPrefix+jobID, data, statusTTL).Err()
}

func (h *Handler) getStatus(ctx context.Context, jobID string) (*CompileStatus, error) {
	data, err := h.Redis.Get(ctx, redisStatusPrefix+jobID).Result()
	if err != nil {
		return nil, err
	}
	var status CompileStatus
	if err := json.Unmarshal([]byte(data), &status); err != nil {
		return nil, err
	}
	return &status, nil
}

func (h *Handler) setLogs(ctx context.Context, jobID, logs string) error {
	return h.Redis.Set(ctx, redisLogPrefix+jobID, logs, logTTL).Err()
}

func (h *Handler) getLogs(ctx context.Context, jobID string) (string, error) {
	return h.Redis.Get(ctx, redisLogPrefix+jobID).Result()
}

// UpdateStatus updates the job status in Redis (called by worker)
func (h *Handler) UpdateStatus(ctx context.Context, jobID, status, errorMsg, pdfURL string) error {
	current, err := h.getStatus(ctx, jobID)
	if err != nil {
		// If status doesn't exist, create a new one
		current = &CompileStatus{
			JobID:     jobID,
			CreatedAt: time.Now().UTC(),
		}
	}

	current.Status = status
	if errorMsg != "" {
		current.Error = errorMsg
	}
	if pdfURL != "" {
		current.PdfURL = pdfURL
	}
	if status == "success" || status == "failed" {
		current.FinishedAt = time.Now().UTC()
	}

	return h.setStatus(ctx, jobID, *current)
}

// StoreLogs stores compilation logs in Redis (called by worker)
func (h *Handler) StoreLogs(ctx context.Context, jobID, logs string) error {
	return h.setLogs(ctx, jobID, logs)
}
