package handlers

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"gollaboratex/server/internal/api/graph/model"
	"gollaboratex/server/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type UploadHandler struct {
	DB     *mongo.Database
	Minio  *minio.Client
	Bucket string
}

// UploadType determines what we're uploading to
type UploadType string

const (
	UploadTypeProject  UploadType = "project"
	UploadTypeTemplate UploadType = "template"
)

// detectFileType determines if file goes to MongoDB or MinIO
func detectFileType(ext string) (model.FileType, bool) {
	ext = strings.ToLower(ext)

	switch ext {
	case ".tex":
		return model.FileTypeTex, true
	case ".bib":
		return model.FileTypeBib, true
	case ".cls":
		return model.FileTypeCls, true
	case ".fls":
		return model.FileTypeFls, true
	case ".sty":
		return model.FileTypeSty, true
	default:
		return model.FileTypeOther, false
	}
}

// ============================================================================
// SINGLE FILE UPLOAD
// ============================================================================

// UploadSingleFile handles single file upload to project
// POST /api/uploads/file
func (h *UploadHandler) UploadSingleFile(c *gin.Context) {
	// Get authenticated user from context
	_, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get projectId from form
	projectID := c.PostForm("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "projectId is required"})
		return
	}

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// Check project access
	projectOID, err := bson.ObjectIDFromHex(projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	hasAccess, err := h.checkProjectAccess(c.Request.Context(), projectOID)
	if err != nil || !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Detect file type
	ext := filepath.Ext(file.Filename)
	fileType, isTextFile := detectFileType(ext)

	if isTextFile {
		// Store in MongoDB
		err = h.storeTextFile(c, projectOID, file, fileType, UploadTypeProject)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "Text file uploaded successfully",
			"type":    fileType,
		})
	} else if ext == ".zip" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use /api/uploads/zip endpoint for ZIP files"})
		return

	} else {
		// Asset upload
		fileReader, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer fileReader.Close()

		objectPath := fmt.Sprintf(
			"project/%s/assets/%s",
			projectOID.Hex(),
			file.Filename,
		)

		err = h.createAsset(
			c.Request.Context(),
			projectOID,
			objectPath,
			fileReader,
			file.Size,
			file.Header.Get("Content-Type"),
			UploadTypeProject,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Asset uploaded successfully",
		})
	}
}

// ============================================================================
// ZIP UPLOAD (UNIFIED - PROJECT OR TEMPLATE)
// ============================================================================

// UploadZIP handles ZIP file upload and extraction
// POST /api/uploads/zip
// Body:
//   - file: ZIP archive
//   - projectId: For projects (mutually exclusive with template params)
//   - name: Template name (for templates)
//   - description: Template description (for templates, optional)
//   - isPublic: Template visibility (for templates, optional)
//   - tags: Template tags (for templates, comma-separated, optional)
//   - previewImage: Template preview image file (for templates, optional)
func (h *UploadHandler) UploadZIP(c *gin.Context) {
	// Get authenticated user
	user, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get ZIP file
	zipFile, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ZIP file is required"})
		return
	}

	// Validate it's a ZIP
	if !strings.HasSuffix(strings.ToLower(zipFile.Filename), ".zip") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File must be a ZIP archive"})
		return
	}

	// Determine if this is a project or template upload
	projectID := c.PostForm("projectId")
	templateName := c.PostForm("name")

	var uploadType UploadType
	var targetID bson.ObjectID

	if projectID != "" {
		// PROJECT UPLOAD
		uploadType = UploadTypeProject

		projectOID, err := bson.ObjectIDFromHex(projectID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
			return
		}

		hasAccess, err := h.checkProjectAccess(c.Request.Context(), projectOID)
		if err != nil || !hasAccess {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		targetID = projectOID

	} else if templateName != "" {
		// TEMPLATE UPLOAD
		uploadType = UploadTypeTemplate

		// Create template document first
		templateDescription := c.PostForm("description")
		isPublic := c.PostForm("isPublic") == "true"
		tagsStr := c.PostForm("tags")

		// Parse tags
		tags := []string{}
		if tagsStr != "" {
			for _, tag := range strings.Split(tagsStr, ",") {
				if trimmed := strings.TrimSpace(tag); trimmed != "" {
					tags = append(tags, trimmed)
				}
			}
		}

		now := time.Now()
		templateDoc := bson.M{
			"name":        templateName,
			"description": templateDescription,
			"authorId":    user.ID,
			"isPublic":    isPublic,
			"tags":        tags,
			"createdAt":   now,
		}

		// Handle preview image upload to MinIO
		previewImageFile, err := c.FormFile("previewImage")
		if err == nil && previewImageFile != nil {
			// Validate image file type
			contentType := previewImageFile.Header.Get("Content-Type")
			validImageTypes := []string{"image/jpeg", "image/jpg", "image/png", "image/webp"}
			isValidImage := false
			for _, validType := range validImageTypes {
				if contentType == validType {
					isValidImage = true
					break
				}
			}

			if !isValidImage {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Preview image must be JPG, PNG, or WebP"})
				return
			}

			// Validate file size (max 5MB)
			if previewImageFile.Size > 5*1024*1024 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Preview image must be less than 5MB"})
				return
			}

			// Generate a unique filename for the preview image
			// We need to insert the template first to get the ID, so we'll use a temporary ID
			tempID := bson.NewObjectID()
			ext := filepath.Ext(previewImageFile.Filename)
			previewImagePath := fmt.Sprintf("template/%s/preview%s", tempID.Hex(), ext)

			// Upload preview image to MinIO
			imageReader, err := previewImageFile.Open()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open preview image"})
				return
			}
			defer imageReader.Close()

			_, err = h.Minio.PutObject(
				c.Request.Context(),
				h.Bucket,
				previewImagePath,
				imageReader,
				previewImageFile.Size,
				minio.PutObjectOptions{ContentType: contentType},
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload preview image"})
				return
			}

			// Store the preview image path in the template document
			templateDoc["previewImage"] = previewImagePath
			templateDoc["_id"] = tempID
		}

		// Insert template document
		var result *mongo.InsertOneResult
		if templateDoc["_id"] != nil {
			// Already has ID from preview image upload
			result, err = h.DB.Collection("templates").InsertOne(c.Request.Context(), templateDoc)
		} else {
			result, err = h.DB.Collection("templates").InsertOne(c.Request.Context(), templateDoc)
		}

		if err != nil {
			// Clean up preview image if it was uploaded
			if previewImagePath, ok := templateDoc["previewImage"].(string); ok {
				h.Minio.RemoveObject(c.Request.Context(), h.Bucket, previewImagePath, minio.RemoveObjectOptions{})
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
			return
		}

		targetID = result.InsertedID.(bson.ObjectID)

	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either projectId or name (for template) is required"})
		return
	}

	// Process ZIP with the target type
	stats, err := h.processZIPInMemory(c, targetID, zipFile, uploadType)
	if err != nil {
		// Cleanup on failure
		if uploadType == UploadTypeTemplate {
			// Delete template document
			h.DB.Collection("templates").DeleteOne(c.Request.Context(), bson.M{"_id": targetID})
			
			// Delete preview image if it exists
			var template struct {
				PreviewImage string `bson:"previewImage"`
			}
			err := h.DB.Collection("templates").FindOne(c.Request.Context(), bson.M{"_id": targetID}).Decode(&template)
			if err == nil && template.PreviewImage != "" {
				h.Minio.RemoveObject(c.Request.Context(), h.Bucket, template.PreviewImage, minio.RemoveObjectOptions{})
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return response based on type
	if uploadType == UploadTypeTemplate {
		c.JSON(http.StatusOK, gin.H{
			"message":       "Template created from ZIP successfully",
			"templateId":    targetID.Hex(),
			"filesCreated":  stats.FilesCreated,
			"assetsCreated": stats.AssetsCreated,
			"errors":        stats.Errors,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message":       "ZIP uploaded and processed successfully",
			"filesCreated":  stats.FilesCreated,
			"assetsCreated": stats.AssetsCreated,
			"errors":        stats.Errors,
		})
	}
}

// ============================================================================
// ZIP PROCESSING
// ============================================================================

type ProcessingStats struct {
	FilesCreated  int
	AssetsCreated int
	Errors        []string
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

func (h *UploadHandler) storeTextFile(c *gin.Context, targetID bson.ObjectID, fileHeader *multipart.FileHeader, fileType model.FileType, uploadType UploadType) error {
	// Open uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read content
	content, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file content: %w", err)
	}

	return h.createFileDocument(c.Request.Context(), targetID, fileHeader.Filename, fileType, string(content), uploadType)
}

func (h *UploadHandler) createFileDocument(ctx context.Context, targetID bson.ObjectID, filename string, fileType model.FileType, content string, uploadType UploadType) error {
	now := time.Now()

	if uploadType == UploadTypeTemplate {
		// Create template file
		templateFileDoc := bson.M{
			"templateId": targetID,
			"name":       filename,
			"type":       string(fileType),
			"content":    content,
		}

		_, err := h.DB.Collection("template_files").InsertOne(ctx, templateFileDoc)
		if err != nil {
			return fmt.Errorf("failed to create template file document: %w", err)
		}
		return nil
	}

	// PROJECT UPLOAD
	// Create File document
	fileDoc := bson.M{
		"projectId": targetID,
		"name":      filename,
		"type":      string(fileType),
		"createdAt": now,
		"updatedAt": now,
	}

	result, err := h.DB.Collection("files").InsertOne(ctx, fileDoc)
	if err != nil {
		return fmt.Errorf("failed to create file document: %w", err)
	}

	fileID := result.InsertedID.(bson.ObjectID)

	// Create WorkingFile document
	workingFileDoc := bson.M{
		"fileId":    fileID,
		"projectId": targetID,
		"content":   content,
		"updatedAt": now,
	}

	_, err = h.DB.Collection("working_files").InsertOne(ctx, workingFileDoc)
	if err != nil {
		return fmt.Errorf("failed to create working file document: %w", err)
	}

	// Update project lastEditedAt
	h.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": targetID},
		bson.M{"$set": bson.M{"lastEditedAt": now}},
	)

	return nil
}

func (h *UploadHandler) createAsset(ctx context.Context,
	targetID bson.ObjectID,
	objectPath string,
	reader io.Reader,
	size int64,
	mimeType string,
	uploadType UploadType) error {

	// Upload to MinIO
	_, err := h.Minio.PutObject(
		ctx,
		h.Bucket,
		objectPath,
		reader,
		size,
		minio.PutObjectOptions{ContentType: mimeType},
	)
	if err != nil {
		return fmt.Errorf("failed to upload to MinIO: %w", err)
	}

	now := time.Now()

	if uploadType == UploadTypeTemplate {
		// Create template asset
		assetDoc := bson.M{
			"templateId": targetID,
			"path":       objectPath,
			"mimeType":   mimeType,
			"size":       size,
			"createdAt":  now,
		}

		_, err = h.DB.Collection("template_assets").InsertOne(ctx, assetDoc)
		if err != nil {
			return fmt.Errorf("failed to write template asset metadata to DB: %w", err)
		}
		return nil
	}

	// PROJECT UPLOAD
	assetDoc := bson.M{
		"projectId": targetID,
		"path":      objectPath,
		"mimeType":  mimeType,
		"size":      size,
		"createdAt": now,
	}

	_, err = h.DB.Collection("assets").InsertOne(ctx, assetDoc)
	if err != nil {
		return fmt.Errorf("failed to write asset metadata to DB: %w", err)
	}

	return nil
}

func (h *UploadHandler) checkProjectAccess(ctx context.Context, projectID bson.ObjectID) (bool, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return false, err
	}

	var project struct {
		OwnerID         bson.ObjectID   `bson:"ownerId"`
		CollaboratorIDs []bson.ObjectID `bson:"collaboratorIds"`
	}

	err = h.DB.Collection("projects").FindOne(ctx, bson.M{"_id": projectID}).Decode(&project)
	if err != nil {
		return false, err
	}

	if project.OwnerID == user.ID {
		return true, nil
	}

	if slices.Contains(project.CollaboratorIDs, user.ID) {
		return true, nil
	}

	return false, nil
}

func (h *UploadHandler) processZIPInMemory(c *gin.Context, targetID bson.ObjectID, zipHeader *multipart.FileHeader, uploadType UploadType) (*ProcessingStats, error) {
	stats := &ProcessingStats{Errors: make([]string, 0)}

	// Open the uploaded multipart file
	file, err := zipHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open upload: %w", err)
	}
	defer file.Close()

	// Create a ZIP reader from the stream
	zipReader, err := zip.NewReader(file, zipHeader.Size)
	if err != nil {
		return nil, fmt.Errorf("invalid zip archive: %w", err)
	}

	for _, zipFile := range zipReader.File {
		// Security: Prevent path traversal
		if strings.Contains(zipFile.Name, "..") || strings.HasPrefix(zipFile.Name, "/") {
			stats.Errors = append(stats.Errors, fmt.Sprintf("Skipped unsafe path: %s", zipFile.Name))
			continue
		}

		// Skip directories
		if zipFile.FileInfo().IsDir() {
			continue
		}

		// Skip macOS metadata files
		if strings.HasPrefix(filepath.Base(zipFile.Name), "._") || strings.Contains(zipFile.Name, "__MACOSX") {
			continue
		}

		// Use a closure to ensure files are closed immediately after each iteration
		err := func() error {
			rc, err := zipFile.Open()
			if err != nil {
				return err
			}
			defer rc.Close()

			ext := filepath.Ext(zipFile.Name)
			fileType, isTextFile := detectFileType(ext)

			if isTextFile {
				// ROUTE TO MONGODB (template_files or project files)
				content, err := io.ReadAll(rc)
				if err != nil {
					return err
				}
				err = h.createFileDocument(c.Request.Context(), targetID, zipFile.Name, fileType, string(content), uploadType)
				if err != nil {
					return err
				}
				stats.FilesCreated++
			} else {
				// ROUTE TO MINIO (template_assets or project assets)
				var objectPath string
				if uploadType == UploadTypeTemplate {
					objectPath = fmt.Sprintf(
						"template/%s/assets/%s",
						targetID.Hex(),
						filepath.Base(zipFile.Name),
					)
				} else {
					objectPath = fmt.Sprintf(
						"project/%s/assets/%s",
						targetID.Hex(),
						filepath.Base(zipFile.Name),
					)
				}

				// Detect MIME type from extension if not provided
				mimeType := ""
				switch strings.ToLower(ext) {
				case ".png":
					mimeType = "image/png"
				case ".jpg", ".jpeg":
					mimeType = "image/jpeg"
				case ".gif":
					mimeType = "image/gif"
				case ".pdf":
					mimeType = "application/pdf"
				case ".svg":
					mimeType = "image/svg+xml"
				}

				err = h.createAsset(
					c.Request.Context(),
					targetID,
					objectPath,
					rc,
					int64(zipFile.UncompressedSize64),
					mimeType,
					uploadType,
				)
				if err != nil {
					return err
				}
				stats.AssetsCreated++
			}
			return nil
		}()

		if err != nil {
			stats.Errors = append(stats.Errors, fmt.Sprintf("Error in %s: %v", zipFile.Name, err))
		}
	}

	return stats, nil
}
