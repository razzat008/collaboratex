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

// UploadSingleFile handles single file upload
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
		err = h.storeTextFile(c, projectOID, file, fileType)
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
// ZIP UPLOAD
// ============================================================================

// UploadZIP handles ZIP file upload and extraction
// POST /api/uploads/zip
func (h *UploadHandler) UploadZIP(c *gin.Context) {
	// Get authenticated user
	_, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get projectId
	projectID := c.PostForm("projectId")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "projectId is required"})
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

	stats, err := h.processZIPInMemory(c, projectOID, zipFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "ZIP uploaded and processed successfully",
		"filesCreated":  stats.FilesCreated,
		"assetsCreated": stats.AssetsCreated,
		"errors":        stats.Errors,
	})
}

// // Create temp directory
// tempDir, err := os.MkdirTemp("", "upload-*")
// if err != nil {
// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp directory"})
// 	return
// }
// defer os.RemoveAll(tempDir)
//
// // Save ZIP to temp location
// zipPath := filepath.Join(tempDir, zipFile.Filename)
// if err := c.SaveUploadedFile(zipFile, zipPath); err != nil {
// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save ZIP file"})
// 	return
// }
//
// // Extract and process ZIP
// stats, err := h.processZIP(c, projectOID, zipPath, tempDir)
// if err != nil {
// 	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 	return
// }
//
// c.JSON(http.StatusOK, gin.H{
// 	"message":       "ZIP uploaded and processed successfully",
// 	"filesCreated":  stats.FilesCreated,
// 	"assetsCreated": stats.AssetsCreated,
// 	"errors":        stats.Errors,
// })
// }

// ============================================================================
// ZIP PROCESSING
// ============================================================================

type ProcessingStats struct {
	FilesCreated  int
	AssetsCreated int
	Errors        []string
}

// func (h *UploadHandler) processZIP(c *gin.Context, projectID bson.ObjectID, zipPath, tempDir string) (*ProcessingStats, error) {
// 	stats := &ProcessingStats{
// 		FilesCreated:  0,
// 		AssetsCreated: 0,
// 		Errors:        make([]string, 0),
// 	}
//
// 	// Open ZIP file
// 	reader, err := zip.OpenReader(zipPath)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to open ZIP: %w", err)
// 	}
// 	defer reader.Close()
//
// 	// Extract directory
// 	extractDir := filepath.Join(tempDir, "extracted")
// 	if err := os.MkdirAll(extractDir, 0755); err != nil {
// 		return nil, fmt.Errorf("failed to create extract directory: %w", err)
// 	}
//
// 	// Extract all files
// 	for _, file := range reader.File {
// 		// Security: prevent path traversal
// 		if strings.Contains(file.Name, "..") {
// 			stats.Errors = append(stats.Errors, fmt.Sprintf("Skipped unsafe path: %s", file.Name))
// 			continue
// 		}
//
// 		// Skip directories
// 		if file.FileInfo().IsDir() {
// 			continue
// 		}
//
// 		// Extract file
// 		extractPath := filepath.Join(extractDir, file.Name)
// 		if err := os.MkdirAll(filepath.Dir(extractPath), 0755); err != nil {
// 			stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to create dir for %s: %v", file.Name, err))
// 			continue
// 		}
//
// 		// Open file in ZIP
// 		rc, err := file.Open()
// 		if err != nil {
// 			stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to open %s: %v", file.Name, err))
// 			continue
// 		}
//
// 		// Create extracted file
// 		outFile, err := os.Create(extractPath)
// 		if err != nil {
// 			rc.Close()
// 			stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to create %s: %v", file.Name, err))
// 			continue
// 		}
//
// 		// Copy content
// 		_, err = io.Copy(outFile, rc)
// 		rc.Close()
// 		outFile.Close()
//
// 		if err != nil {
// 			stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to extract %s: %v", file.Name, err))
// 			continue
// 		}
//
// 		// Process extracted file
// 		ext := filepath.Ext(file.Name)
// 		fileType, isTextFile := detectFileType(ext)
//
// 		if isTextFile {
// 			// Read file content
// 			content, err := os.ReadFile(extractPath)
// 			if err != nil {
// 				stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to read %s: %v", file.Name, err))
// 				continue
// 			}
//
// 			// Create File + WorkingFile in MongoDB
// 			err = h.createFileDocument(c.Request.Context(), projectID, file.Name, fileType, string(content))
// 			if err != nil {
// 				stats.Errors = append(stats.Errors, fmt.Sprintf("Failed to store %s: %v", file.Name, err))
// 				continue
// 			}
//
// 			stats.FilesCreated++
// 		} else {
// 			fileReader, err := os.Open(extractPath)
// 			if err != nil {
// 				stats.Errors = append(stats.Errors, err.Error())
// 				continue
// 			}
// 			defer fileReader.Close()
//
// 			info, _ := fileReader.Stat()
//
// 			objectPath := fmt.Sprintf(
// 				"project/%s/assets/%d-%s",
// 				projectID.Hex(),
// 				time.Now().UnixNano(),
// 				file.Name,
// 			)
//
// 			err = h.createAsset(
// 				c.Request.Context(),
// 				projectID,
// 				objectPath,
// 				fileReader,
// 				info.Size(),
// 				"",
// 			)
// 			if err != nil {
// 				stats.Errors = append(stats.Errors, err.Error())
// 				continue
// 			}
//
// 			stats.AssetsCreated++
// 		}
// 	}
//
// 	return stats, nil
// }

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

func (h *UploadHandler) storeTextFile(c *gin.Context, projectID bson.ObjectID, fileHeader *multipart.FileHeader, fileType model.FileType) error {
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

	return h.createFileDocument(c.Request.Context(), projectID, fileHeader.Filename, fileType, string(content))
}

func (h *UploadHandler) createFileDocument(ctx context.Context, projectID bson.ObjectID, filename string, fileType model.FileType, content string) error {
	now := time.Now()

	// Create File document
	fileDoc := bson.M{
		"projectId": projectID,
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
		"projectId": projectID,
		"content":   content,
		"updatedAt": now,
	}

	_, err = h.DB.Collection("working_files").InsertOne(ctx, workingFileDoc)
	if err != nil {
		return fmt.Errorf("failed to create working file document: %w", err)
	}

	// Update project lastEditedAt
	h.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": projectID},
		bson.M{"$set": bson.M{"lastEditedAt": now}},
	)

	return nil
}

// asset creation logic

func (h *UploadHandler) createAsset(ctx context.Context,
	projectID bson.ObjectID,
	objectPath string,
	reader io.Reader,
	size int64,
	mimeType string) error {
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
		return fmt.Errorf("failed to create asset : %w", err)
	}

	now := time.Now()

	assetDoc := bson.M{
		"projectId": projectID,
		"path":      objectPath,
		"mimeType":  mimeType,
		"size":      size,
		"createdAt": now,
	}

	_, err = h.DB.Collection("assets").InsertOne(ctx, assetDoc)
	if err != nil {
		return fmt.Errorf("failed to write metadata to DB : %w", err)
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

func (h *UploadHandler) processZIPInMemory(c *gin.Context, projectID bson.ObjectID, zipHeader *multipart.FileHeader) (*ProcessingStats, error) {
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

		if zipFile.FileInfo().IsDir() {
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
				// ROUTE TO MONGODB
				content, err := io.ReadAll(rc)
				if err != nil {
					return err
				}
				err = h.createFileDocument(c.Request.Context(), projectID, zipFile.Name, fileType, string(content))
				if err != nil {
					return err
				}
				stats.FilesCreated++
			} else {
				// ROUTE TO MINIO
				objectPath := fmt.Sprintf(
					"project/%s/assets/%s",
					projectID.Hex(),
					filepath.Base(zipFile.Name),
				)

				err = h.createAsset(
					c.Request.Context(),
					projectID,
					objectPath,
					rc,
					int64(zipFile.UncompressedSize64),
					"",
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
