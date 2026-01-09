package graph

import (
	"gollaboratex/server/internal/api/graph/model"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require
// here.

type Resolver struct {
	DB       *mongo.Database
	Projects []*model.Project
	Users    []*model.User
}
