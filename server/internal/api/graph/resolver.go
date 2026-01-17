package graph

import (
	"context"
	"gollaboratex/server/internal/api/graph/model"
	"slices"
	"time"

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
// Resolver struct
// =============================================

type Resolver struct {
	DB *mongo.Database
}

// NewResolver creates a new resolver with MongoDB database
func NewResolver(db *mongo.Database) *Resolver {
	return &Resolver{
		DB: db,
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

// Version returns VersionResolver implementation.
func (r *Resolver) Version() VersionResolver { return &versionResolver{r} }

type fileResolver struct{ *Resolver }
type mutationResolver struct{ *Resolver }
type projectResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
type versionResolver struct{ *Resolver }
