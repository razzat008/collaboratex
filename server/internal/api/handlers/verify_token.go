package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type User struct {
	ID          string `json:"id" bson:"_id,omitempty"`
	ClerkUserID string `json:"clerk_user_id" bson:"clerk_user_id"`
	Email       string `json:"email" bson:"email"`
	Name        string `json:"name" bson:"name"`
}

// VerifyTokenHandler verifies Clerk JWT tokens for the y-websocket server
func VerifyTokenHandler(database *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
			})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format",
			})
			return
		}

		// Verify token with Clerk
			claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
				Token: token,
			})
		if err != nil {
			log.Printf("Token verification failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid token",
			})
			return
		}

		// Get user from database
		clerkUserID := claims.Subject
		usersCollection := database.Collection("users")

		var user User
		err = usersCollection.FindOne(context.Background(), bson.M{
			"clerk_user_id": clerkUserID,
		}).Decode(&user)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				// User doesn't exist in our DB yet - this is fine for websocket
				c.JSON(http.StatusOK, gin.H{
					"clerk_user_id": clerkUserID,
					"id":            clerkUserID,
				})
				return
			}

			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "database error",
			})
			return
		}

		// Return user info
		c.JSON(http.StatusOK, user)
	}
}
