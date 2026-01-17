package download

import (
	"archive/zip"
	// "context"
	"io"
	"net/http"
	"path/filepath"
	"slices"

	"gollaboratex/server/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type ProjectHandler struct {
	DB     *mongo.Database
	Minio  *minio.Client
	Bucket string
}

func (h *ProjectHandler) checkProjectAccess(ctx *gin.Context, projectID bson.ObjectID) (bool, error) {
	user, err := middleware.GetUserFromContext(ctx.Request.Context())
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


func (h *ProjectHandler) DownloadProject(c *gin.Context) {
	_, err := middleware.GetUserFromContext(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	projectIDHex := c.Param("id")
	projectID, err := bson.ObjectIDFromHex(projectIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	hasAccess, err := h.checkProjectAccess(c, projectID)
	if err != nil || !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "so this is the issue denied"})
		return
	}

	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=project.zip")

	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	// 1️⃣ Add text files
	cursor, err := h.DB.Collection("files").Find(c, bson.M{"projectId": projectID})
	if err != nil {
		return
	}
	defer cursor.Close(c)

	for cursor.Next(c) {
		var file bson.M
		cursor.Decode(&file)

		var working bson.M
		h.DB.Collection("working_files").FindOne(
			c,
			bson.M{"fileId": file["_id"]},
		).Decode(&working)

		f, _ := zipWriter.Create(file["name"].(string))
		f.Write([]byte(working["content"].(string)))
	}

	// 2️⃣ Add assets from MinIO
	assetCursor, err := h.DB.Collection("assets").Find(c, bson.M{"projectId": projectID})
	if err != nil {
		return
	}
	defer assetCursor.Close(c)

	for assetCursor.Next(c) {
		var asset bson.M
		assetCursor.Decode(&asset)

		objectKey := asset["path"].(string)

		obj, err := h.Minio.GetObject(
			c,
			h.Bucket,
			objectKey,
			minio.GetObjectOptions{},
		)
		if err != nil {
			continue
		}
		defer obj.Close()

		f, _ := zipWriter.Create("assets/" + filepath.Base(objectKey))
		io.Copy(f, obj)
	}
}
