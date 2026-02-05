package graph

import (
	"context"
	"gollaboratex/server/internal/api/graph/model"
	"slices"
	"time"

	"github.com/minio/minio-go/v7"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

// =============================================
// MongoDB models (internal to resolvers)
// =============================================

type UserDoc struct {
	ID          bson.ObjectID `bson:"_id,omitempty"`
	ClerkUserID string        `bson:"clerkUserId"`
	CreatedAt   time.Time     `bson:"createdAt"`
}

type AssetDoc struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	ProjectID bson.ObjectID `bson:"projectId"`
	Path      string        `bson:"path"`
	MimeType  string        `bson:"mimeType"`
	Size      int           `bson:"size"`
	CreatedAt time.Time     `bson:"createdAt"`
}

type ProjectDoc struct {
	ID              bson.ObjectID   `bson:"_id,omitempty"`
	ProjectName     string          `bson:"projectName"`
	OwnerID         bson.ObjectID   `bson:"ownerId"`
	CollaboratorIDs []bson.ObjectID `bson:"collaboratorIds"`
	RootFileID      bson.ObjectID   `bson:"rootFileId"`
	LastEditedAt    time.Time       `bson:"lastEditedAt"`
	CreatedAt       time.Time       `bson:"createdAt"`
}

type FileDoc struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	ProjectID bson.ObjectID `bson:"projectId"`
	Name      string        `bson:"name"`
	Type      string        `bson:"type"`
	CreatedAt time.Time     `bson:"createdAt"`
	UpdatedAt time.Time     `bson:"updatedAt"`
}

type WorkingFileDoc struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	FileID    bson.ObjectID `bson:"fileId"`
	ProjectID bson.ObjectID `bson:"projectId"`
	Content   string        `bson:"content"`
	UpdatedAt time.Time     `bson:"updatedAt"`
}

type VersionDoc struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	ProjectID bson.ObjectID `bson:"projectId"`
	Message   *string       `bson:"message,omitempty"`
	CreatedAt time.Time     `bson:"createdAt"`
}

type VersionFileDoc struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	VersionID bson.ObjectID `bson:"versionId"`
	FileID    bson.ObjectID `bson:"fileId"`
	Name      string        `bson:"name"`
	Type      string        `bson:"type"`
	Content   string        `bson:"content"`
}

// =============================================
// Template Document Models
// =============================================

type TemplateDoc struct {
	ID           bson.ObjectID `bson:"_id,omitempty"`
	Name         string        `bson:"name"`
	Description  *string       `bson:"description,omitempty"`
	AuthorID     bson.ObjectID `bson:"authorId"`
	IsPublic     bool          `bson:"isPublic"`
	Tags         []string      `bson:"tags"`
	PreviewImage *string       `bson:"previewImage,omitempty"`
	CreatedAt    time.Time     `bson:"createdAt"`
}

type TemplateFileDoc struct {
	ID         bson.ObjectID `bson:"_id,omitempty"`
	TemplateID bson.ObjectID `bson:"templateId"`
	Name       string        `bson:"name"`
	Type       string        `bson:"type"`
	Content    string        `bson:"content"`
}

type TemplateAssetDoc struct {
	ID         bson.ObjectID `bson:"_id,omitempty"`
	TemplateID bson.ObjectID `bson:"templateId"`
	Path       string        `bson:"path"`
	MimeType   string        `bson:"mimeType"`
	Size       int           `bson:"size"`
	CreatedAt  time.Time     `bson:"createdAt"`
}

// =============================================
// Resolver struct
// =============================================

type Resolver struct {
	DB     *mongo.Database
	Minio  *minio.Client
	Bucket string
}

// NewResolver creates a new resolver with MongoDB database
func NewResolver(db *mongo.Database, minioClient *minio.Client, bucketName string) *Resolver {
	return &Resolver{
		DB:     db,
		Minio:  minioClient,
		Bucket: bucketName,
	}
}

// =============================================
// Helper functions
// =============================================

func (r *Resolver) hasProjectAccess(ctx context.Context, projectID bson.ObjectID, userID bson.ObjectID) (bool, error) {
	var project ProjectDoc
	err := r.DB.Collection("projects").FindOne(ctx, bson.M{"_id": projectID}).Decode(&project)
	if err != nil {
		return false, err
	}

	if project.OwnerID == userID {
		return true, nil
	}

	if slices.Contains(project.CollaboratorIDs, userID) {
		return true, nil
	}

	return false, nil
}

func (r *Resolver) isProjectOwner(ctx context.Context, projectID bson.ObjectID, userID bson.ObjectID) (bool, error) {
	var project ProjectDoc
	err := r.DB.Collection("projects").FindOne(ctx, bson.M{"_id": projectID}).Decode(&project)
	if err != nil {
		return false, err
	}
	return project.OwnerID == userID, nil
}

func toObjectID(id string) (bson.ObjectID, error) {
	return bson.ObjectIDFromHex(id)
}

func toObjectIDs(ids []string) ([]bson.ObjectID, error) {
	result := make([]bson.ObjectID, len(ids))
	for i, id := range ids {
		oid, err := bson.ObjectIDFromHex(id)
		if err != nil {
			return nil, err
		}
		result[i] = oid
	}
	return result, nil
}

func fileTypeToString(ft model.FileType) string {
	return string(ft)
}

func stringToFileType(s string) model.FileType {
	switch s {
	case "TEX":
		return model.FileTypeTex
	case "BIB":
		return model.FileTypeBib
	case "CLS":
		return model.FileTypeCls
	case "FLS":
		return model.FileTypeFls
	case "STY":
		return model.FileTypeSty
	default:
		return model.FileTypeOther
	}
}

// templateDocToModel converts a TemplateDoc to a GraphQL Template model
func (r *Resolver) TemplateDocToModel(ctx context.Context, doc *TemplateDoc) *model.Template {
	// Fetch template files
	cursor, _ := r.DB.Collection("template_files").Find(ctx, bson.M{"templateId": doc.ID})
	var templateFileDocs []TemplateFileDoc
	if cursor != nil {
		cursor.All(ctx, &templateFileDocs)
		cursor.Close(ctx)
	}

	files := make([]*model.TemplateFile, len(templateFileDocs))
	for i, tf := range templateFileDocs {
		files[i] = &model.TemplateFile{
			ID:         tf.ID.Hex(),
			TemplateID: tf.TemplateID.Hex(),
			Name:       tf.Name,
			Type:       stringToFileType(tf.Type),
			Content:    tf.Content,
		}
	}

	// Fetch template assets
	assetCursor, _ := r.DB.Collection("template_assets").Find(ctx, bson.M{"templateId": doc.ID})
	var templateAssetDocs []TemplateAssetDoc
	if assetCursor != nil {
		assetCursor.All(ctx, &templateAssetDocs)
		assetCursor.Close(ctx)
	}

	assets := make([]*model.TemplateAsset, len(templateAssetDocs))
	for i, ta := range templateAssetDocs {
		assets[i] = &model.TemplateAsset{
			ID:         ta.ID.Hex(),
			TemplateID: ta.TemplateID.Hex(),
			Path:       ta.Path,
			MimeType:   ta.MimeType,
			Size:       int32(ta.Size),
			CreatedAt:  ta.CreatedAt.Format(time.RFC3339),
		}
	}

	return &model.Template{
		ID:           doc.ID.Hex(),
		Name:         doc.Name,
		Description:  doc.Description,
		CreatedAt:    doc.CreatedAt.Format(time.RFC3339),
		AuthorID:     doc.AuthorID.Hex(),
		IsPublic:     doc.IsPublic,
		PreviewImage: doc.PreviewImage,
		Tags:         doc.Tags,
		Files:        files,
		Assets:       assets,
	}
}

// =============================================
// Resolver implementations
// =============================================
// File returns FileResolver implementation.
func (r *Resolver) File() FileResolver { return &fileResolver{r} }

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Project returns ProjectResolver implementation.
func (r *Resolver) Project() ProjectResolver { return &projectResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

// Subscription returns SubscriptionResolver implementation.
func (r *Resolver) Subscription() SubscriptionResolver { return &subscriptionResolver{r} }

// Template returns TemplateResolver implementation.
func (r *Resolver) Template() TemplateResolver { return &templateResolver{r} }

// Version returns VersionResolver implementation.
func (r *Resolver) Version() VersionResolver { return &versionResolver{r} }

type fileResolver struct{ *Resolver }
type mutationResolver struct{ *Resolver }
type projectResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
type templateResolver struct{ *Resolver }
type versionResolver struct{ *Resolver }
