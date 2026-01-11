package graph

import (
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DB *mongo.Database
}

// NewResolver creates a new resolver with MongoDB database
func NewResolver(db *mongo.Database) *Resolver {
	return &Resolver{
		DB: db,
	}
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { 
	return &mutationResolver{r} 
}

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { 
	return &queryResolver{r} 
}

// Subscription returns SubscriptionResolver implementation.
func (r *Resolver) Subscription() SubscriptionResolver { 
	return &subscriptionResolver{r} 
}

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
