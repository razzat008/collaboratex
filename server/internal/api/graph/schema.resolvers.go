package graph

import (
	"context"
	"errors"
	"gollaboratex/server/internal/api/graph/model"
	"gollaboratex/server/internal/middleware"
	"slices"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// =============================================
// MongoDB models ( internal to resolvers )
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
// Mutation resolvers
// =============================================

func (r *mutationResolver) CreateProject(ctx context.Context, input model.NewProjectInput) (*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	// Create root file first
	rootFile := FileDoc{
		Name:      "main.tex",
		Type:      "TEX",
		CreatedAt: now,
		UpdatedAt: now,
	}

	rootFileResult, err := r.DB.Collection("files").InsertOne(ctx, rootFile)
	if err != nil {
		return nil, err
	}
	rootFileID := rootFileResult.InsertedID.(bson.ObjectID)

	// Create project
	project := ProjectDoc{
		ProjectName:     input.ProjectName,
		OwnerID:         user.ID,
		CollaboratorIDs: []bson.ObjectID{},
		RootFileID:      rootFileID,
		LastEditedAt:    now,
		CreatedAt:       now,
	}

	projectResult, err := r.DB.Collection("projects").InsertOne(ctx, project)
	if err != nil {
		return nil, err
	}
	project.ID = projectResult.InsertedID.(bson.ObjectID)

	// Update root file with projectId
	r.DB.Collection("files").UpdateOne(ctx,
		bson.M{"_id": rootFileID},
		bson.M{"$set": bson.M{"projectId": project.ID}},
	)

	// Create root working file
	workingFile := WorkingFileDoc{
		FileID:    rootFileID,
		ProjectID: project.ID,
		Content:   "",
		UpdatedAt: now,
	}

	_, err = r.DB.Collection("working_files").InsertOne(ctx, workingFile)
	if err != nil {
		return nil, err
	}

	// Convert to GraphQL model
	collabIDs := make([]string, len(project.CollaboratorIDs))
	for i, id := range project.CollaboratorIDs {
		collabIDs[i] = id.Hex()
	}

	return &model.Project{
		ID:              project.ID.Hex(),
		ProjectName:     project.ProjectName,
		CreatedAt:       project.CreatedAt.Format(time.RFC3339),
		LastEditedAt:    project.LastEditedAt.Format(time.RFC3339),
		OwnerID:         project.OwnerID.Hex(),
		CollaboratorIds: collabIDs,
		RootFileID:      project.RootFileID.Hex(),
	}, nil
}

// DeleteProject is the resolver for the deleteProject field.
func (r *mutationResolver) DeleteProject(ctx context.Context, projectID string) (bool, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return false, err
	}

	projectOID, err := toObjectID(projectID)
	if err != nil {
		return false, err
	}

	isOwner, err := r.isProjectOwner(ctx, projectOID, user.ID)
	if err != nil || !isOwner {
		return false, errors.New("only owner can delete project")
	}

	// Get all files
	cursor, err := r.DB.Collection("files").Find(ctx, bson.M{"projectId": projectOID})
	if err != nil {
		return false, err
	}
	defer cursor.Close(ctx)

	var files []FileDoc
	cursor.All(ctx, &files)

	// Delete all working files
	for _, file := range files {
		r.DB.Collection("working_files").DeleteOne(ctx, bson.M{"fileId": file.ID})
	}

	// Delete all files
	r.DB.Collection("files").DeleteMany(ctx, bson.M{"projectId": projectOID})

	// Delete project (versions remain)
	_, err = r.DB.Collection("projects").DeleteOne(ctx, bson.M{"_id": projectOID})
	if err != nil {
		return false, err
	}

	return true, nil
}

// AddCollaborator is the resolver for the addCollaborator field.
func (r *mutationResolver) AddCollaborator(ctx context.Context, projectID string, userID string) (*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(projectID)
	if err != nil {
		return nil, err
	}

	isOwner, err := r.isProjectOwner(ctx, projectOID, user.ID)
	if err != nil || !isOwner {
		return nil, errors.New("only owner can add collaborators")
	}

	// Get collaborator user by clerkUserId
	var collaborator UserDoc
	err = r.DB.Collection("users").FindOne(ctx, bson.M{"clerkUserId": userID}).Decode(&collaborator)
	if err != nil {
		return nil, errors.New("collaborator not found")
	}

	_, err = r.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": projectOID},
		bson.M{"$addToSet": bson.M{"collaboratorIds": collaborator.ID}},
	)
	if err != nil {
		return nil, err
	}

	// Use the query resolver through the parent Resolver
	qr := &queryResolver{r.Resolver}
	return qr.Project(ctx, projectID)
}

// RemoveCollaborator is the resolver for the removeCollaborator field.
func (r *mutationResolver) RemoveCollaborator(ctx context.Context, projectID string, userID string) (*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(projectID)
	if err != nil {
		return nil, err
	}

	isOwner, err := r.isProjectOwner(ctx, projectOID, user.ID)
	if err != nil || !isOwner {
		return nil, errors.New("only owner can remove collaborators")
	}

	collaboratorOID, err := toObjectID(userID)
	if err != nil {
		return nil, err
	}

	_, err = r.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": projectOID},
		bson.M{"$pull": bson.M{"collaboratorIds": collaboratorOID}},
	)
	if err != nil {
		return nil, err
	}

	// Use the query resolver through the parent Resolver
	qr := &queryResolver{r.Resolver}
	return qr.Project(ctx, projectID)
}

// CreateFile is the resolver for the createFile field.
func (r *mutationResolver) CreateFile(ctx context.Context, input model.NewFileInput) (*model.File, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(input.ProjectID)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, projectOID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	now := time.Now()
	file := FileDoc{
		ProjectID: projectOID,
		Name:      input.Name,
		Type:      fileTypeToString(input.Type),
		CreatedAt: now,
		UpdatedAt: now,
	}

	fileResult, err := r.DB.Collection("files").InsertOne(ctx, file)
	if err != nil {
		return nil, err
	}
	file.ID = fileResult.InsertedID.(bson.ObjectID)

	workingFile := WorkingFileDoc{
		FileID:    file.ID,
		ProjectID: projectOID,
		Content:   "",
		UpdatedAt: now,
	}

	_, err = r.DB.Collection("working_files").InsertOne(ctx, workingFile)
	if err != nil {
		return nil, err
	}

	// Update project lastEditedAt
	r.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": projectOID},
		bson.M{"$set": bson.M{"lastEditedAt": now}},
	)

	return &model.File{
		ID:        file.ID.Hex(),
		ProjectID: file.ProjectID.Hex(),
		Name:      file.Name,
		Type:      stringToFileType(file.Type),
		CreatedAt: file.CreatedAt.Format(time.RFC3339),
		UpdatedAt: file.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// RenameFile is the resolver for the renameFile field.
func (r *mutationResolver) RenameFile(ctx context.Context, fileID string, name string) (*model.File, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	fileOID, err := toObjectID(fileID)
	if err != nil {
		return nil, err
	}

	var file FileDoc
	err = r.DB.Collection("files").FindOne(ctx, bson.M{"_id": fileOID}).Decode(&file)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, file.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	now := time.Now()
	_, err = r.DB.Collection("files").UpdateOne(ctx,
		bson.M{"_id": fileOID},
		bson.M{"$set": bson.M{"name": name, "updatedAt": now}},
	)
	if err != nil {
		return nil, err
	}

	// Use the query resolver through the parent Resolver
	qr := &queryResolver{r.Resolver}
	return qr.File(ctx, fileID)
}

func (r *mutationResolver) CreateAsset(ctx context.Context, input model.CreateAssetInput) (*model.Asset, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(input.ProjectID)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, projectOID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	now := time.Now()
	asset := AssetDoc{
		ProjectID: projectOID,
		Path:      input.Path,
		MimeType:  input.MimeType,
		Size:      int(input.Size),
		CreatedAt: now,
	}

	result, err := r.DB.Collection("assets").InsertOne(ctx, asset)
	if err != nil {
		return nil, err
	}
	asset.ID = result.InsertedID.(bson.ObjectID)

	return &model.Asset{
		ID:        asset.ID.Hex(),
		ProjectID: asset.ProjectID.Hex(),
		Path:      asset.Path,
		MimeType:  asset.MimeType,
		Size:      int32(asset.Size),
		CreatedAt: asset.CreatedAt.Format(time.RFC3339),
	}, nil
}

// DeleteFile is the resolver for the deleteFile field.
func (r *mutationResolver) DeleteFile(ctx context.Context, fileID string) (bool, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return false, err
	}

	fileOID, err := toObjectID(fileID)
	if err != nil {
		return false, err
	}

	var file FileDoc
	err = r.DB.Collection("files").FindOne(ctx, bson.M{"_id": fileOID}).Decode(&file)
	if err != nil {
		return false, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, file.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return false, errors.New("access denied")
	}

	// Delete file and working file (keep version files)
	r.DB.Collection("files").DeleteOne(ctx, bson.M{"_id": fileOID})
	r.DB.Collection("working_files").DeleteOne(ctx, bson.M{"fileId": fileOID})

	return true, nil
}

// UpdateWorkingFile is the resolver for the updateWorkingFile field.
func (r *mutationResolver) UpdateWorkingFile(ctx context.Context, input model.UpdateWorkingFileInput) (*model.WorkingFile, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	fileOID, err := toObjectID(input.FileID)
	if err != nil {
		return nil, err
	}

	// Get file to check project access
	var file FileDoc
	err = r.DB.Collection("files").FindOne(ctx, bson.M{"_id": fileOID}).Decode(&file)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, file.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"content":   input.Content,
			"updatedAt": now,
		},
	}

	var workingFile WorkingFileDoc
	err = r.DB.Collection("working_files").FindOneAndUpdate(
		ctx,
		bson.M{"fileId": fileOID},
		update,
		// options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&workingFile)
	if err != nil {
		return nil, err
	}

	// Update project lastEditedAt
	r.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": file.ProjectID},
		bson.M{"$set": bson.M{"lastEditedAt": now}},
	)

	// Use the query resolver through the parent Resolver
	qr := &queryResolver{r.Resolver}
	return qr.WorkingFile(ctx, input.FileID)
}

// CreateVersion is the resolver for the createVersion field.
func (r *mutationResolver) CreateVersion(ctx context.Context, input model.CreateVersionInput) (*model.Version, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(input.ProjectID)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, projectOID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	// Fetch all files for this project
	cursor, err := r.DB.Collection("files").Find(ctx, bson.M{"projectId": projectOID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var files []FileDoc
	if err = cursor.All(ctx, &files); err != nil {
		return nil, err
	}

	// Create version
	now := time.Now()
	version := VersionDoc{
		ProjectID: projectOID,
		Message:   input.Message,
		CreatedAt: now,
	}

	versionResult, err := r.DB.Collection("versions").InsertOne(ctx, version)
	if err != nil {
		return nil, err
	}
	version.ID = versionResult.InsertedID.(bson.ObjectID)

	// Create version files
	for _, file := range files {
		var workingFile WorkingFileDoc
		err = r.DB.Collection("working_files").FindOne(ctx, bson.M{"fileId": file.ID}).Decode(&workingFile)
		if err != nil {
			continue
		}

		versionFile := VersionFileDoc{
			VersionID: version.ID,
			FileID:    file.ID,
			Name:      file.Name,
			Type:      file.Type,
			Content:   workingFile.Content,
		}

		r.DB.Collection("version_files").InsertOne(ctx, versionFile)
	}

	return &model.Version{
		ID:        version.ID.Hex(),
		ProjectID: version.ProjectID.Hex(),
		CreatedAt: version.CreatedAt.Format(time.RFC3339),
		Message:   version.Message,
	}, nil
}

// RestoreVersion is the resolver for the restoreVersion field.
func (r *mutationResolver) RestoreVersion(ctx context.Context, versionID string) (*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	versionOID, err := toObjectID(versionID)
	if err != nil {
		return nil, err
	}

	// Get version
	var version VersionDoc
	err = r.DB.Collection("versions").FindOne(ctx, bson.M{"_id": versionOID}).Decode(&version)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, version.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	// Get version files
	cursor, err := r.DB.Collection("version_files").Find(ctx, bson.M{"versionId": versionOID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var versionFiles []VersionFileDoc
	if err = cursor.All(ctx, &versionFiles); err != nil {
		return nil, err
	}

	now := time.Now()

	// Restore each file
	for _, vf := range versionFiles {
		update := bson.M{
			"$set": bson.M{
				"content":   vf.Content,
				"updatedAt": now,
			},
		}

		r.DB.Collection("working_files").UpdateOne(ctx,
			bson.M{"fileId": vf.FileID},
			update,
		)
	}

	// Update project lastEditedAt
	r.DB.Collection("projects").UpdateOne(ctx,
		bson.M{"_id": version.ProjectID},
		bson.M{"$set": bson.M{"lastEditedAt": now}},
	)

	// Use the query resolver through the parent Resolver
	qr := &queryResolver{r.Resolver}
	return qr.Project(ctx, version.ProjectID.Hex())
}

// =============================================
// Query resolvers
// =============================================

// Projects is the resolver for the projects field.
func (r *queryResolver) Projects(ctx context.Context) ([]*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	filter := bson.M{
		"$or": []bson.M{
			{"ownerId": user.ID},
			{"collaboratorIds": user.ID},
		},
	}

	cursor, err := r.DB.Collection("projects").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projectDocs []ProjectDoc
	if err = cursor.All(ctx, &projectDocs); err != nil {
		return nil, err
	}

	projects := make([]*model.Project, len(projectDocs))
	for i, p := range projectDocs {
		collabIDs := make([]string, len(p.CollaboratorIDs))
		for j, id := range p.CollaboratorIDs {
			collabIDs[j] = id.Hex()
		}

		projects[i] = &model.Project{
			ID:              p.ID.Hex(),
			ProjectName:     p.ProjectName,
			CreatedAt:       p.CreatedAt.Format(time.RFC3339),
			LastEditedAt:    p.LastEditedAt.Format(time.RFC3339),
			OwnerID:         p.OwnerID.Hex(),
			CollaboratorIds: collabIDs,
			RootFileID:      p.RootFileID.Hex(),
		}
	}

	return projects, nil
}

// Project is the resolver for the project field.
func (r *queryResolver) Project(ctx context.Context, id string) (*model.Project, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	projectOID, err := toObjectID(id)
	if err != nil {
		return nil, err
	}

	var project ProjectDoc
	err = r.DB.Collection("projects").FindOne(ctx, bson.M{"_id": projectOID}).Decode(&project)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, projectOID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	collabIDs := make([]string, len(project.CollaboratorIDs))
	for i, id := range project.CollaboratorIDs {
		collabIDs[i] = id.Hex()
	}

	return &model.Project{
		ID:              project.ID.Hex(),
		ProjectName:     project.ProjectName,
		CreatedAt:       project.CreatedAt.Format(time.RFC3339),
		LastEditedAt:    project.LastEditedAt.Format(time.RFC3339),
		OwnerID:         project.OwnerID.Hex(),
		CollaboratorIds: collabIDs,
		RootFileID:      project.RootFileID.Hex(),
	}, nil
}

// File is the resolver for the file field.
func (r *queryResolver) File(ctx context.Context, id string) (*model.File, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	fileOID, err := toObjectID(id)
	if err != nil {
		return nil, err
	}

	var file FileDoc
	err = r.DB.Collection("files").FindOne(ctx, bson.M{"_id": fileOID}).Decode(&file)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, file.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	return &model.File{
		ID:        file.ID.Hex(),
		ProjectID: file.ProjectID.Hex(),
		Name:      file.Name,
		Type:      stringToFileType(file.Type),
		CreatedAt: file.CreatedAt.Format(time.RFC3339),
		UpdatedAt: file.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// WorkingFile is the resolver for the workingFile field.
func (r *queryResolver) WorkingFile(ctx context.Context, fileID string) (*model.WorkingFile, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	fileOID, err := toObjectID(fileID)
	if err != nil {
		return nil, err
	}

	// Get file to check project access
	var file FileDoc
	err = r.DB.Collection("files").FindOne(ctx, bson.M{"_id": fileOID}).Decode(&file)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, file.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	var workingFile WorkingFileDoc
	err = r.DB.Collection("working_files").FindOne(ctx, bson.M{"fileId": fileOID}).Decode(&workingFile)
	if err != nil {
		return nil, err
	}

	return &model.WorkingFile{
		ID:        workingFile.ID.Hex(),
		FileID:    workingFile.FileID.Hex(),
		ProjectID: workingFile.ProjectID.Hex(),
		Content:   workingFile.Content,
		UpdatedAt: workingFile.UpdatedAt.Format(time.RFC3339),
	}, nil
}

// Version is the resolver for the version field.
func (r *queryResolver) Version(ctx context.Context, id string) (*model.Version, error) {
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		return nil, err
	}

	versionOID, err := toObjectID(id)
	if err != nil {
		return nil, err
	}

	var version VersionDoc
	err = r.DB.Collection("versions").FindOne(ctx, bson.M{"_id": versionOID}).Decode(&version)
	if err != nil {
		return nil, err
	}

	hasAccess, err := r.hasProjectAccess(ctx, version.ProjectID, user.ID)
	if err != nil || !hasAccess {
		return nil, errors.New("access denied")
	}

	return &model.Version{
		ID:        version.ID.Hex(),
		ProjectID: version.ProjectID.Hex(),
		CreatedAt: version.CreatedAt.Format(time.RFC3339),
		Message:   version.Message,
	}, nil
}

// WorkingFileUpdated is the resolver for the workingFileUpdated field.
func (r *subscriptionResolver) WorkingFileUpdated(ctx context.Context, projectID string) (<-chan *model.WorkingFile, error) {
	// TODO: Implement using channels and MongoDB change streams or pub/sub
	// This is a placeholder - real implementation would use:
	// - MongoDB change streams to watch working_files collection
	// - Redis pub/sub for distributed systems
	// - In-memory channels for single-instance setups

	ch := make(chan *model.WorkingFile)

	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}

// ProjectUpdated is the resolver for the projectUpdated field.
func (r *subscriptionResolver) ProjectUpdated(ctx context.Context, projectID string) (<-chan *model.Project, error) {
	// TODO: Implement using channels and MongoDB change streams or pub/sub

	ch := make(chan *model.Project)

	go func() {
		<-ctx.Done()
		close(ch)
	}()

	return ch, nil
}
