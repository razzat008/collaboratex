package middleware

import (
	"context"
	"errors"
	"gollaboratex/server/internal/middleware/usercontext"
	"log"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
)

type UserDoc struct {
	ID          bson.ObjectID `bson:"_id,omitempty"`
	ClerkUserID string        `bson:"clerkUserId"`
	CreatedAt   time.Time     `bson:"createdAt"`
}

// GinClerkAuthMiddleware verifies Clerk JWT tokens and adds user to Gin context
func GinClerkAuthMiddleware(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string

		if strings.Contains(c.Request.URL.Path, "/ws/") {
			// For WebSocket: check query parameter
			token = c.Query("token")
			log.Printf("WebSocket token from query: %v", token != "")
		}

		if token == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
				c.Abort()
				return
			}

			token = strings.TrimPrefix(authHeader, "Bearer ")
			if token == authHeader {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
				c.Abort()
				return
			}
		}

		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token: token,
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Get clerkUserId from claims
		clerkUserID := claims.Subject
		if clerkUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
		// log.Println(">>> Clerk user:", clerkUserID)

		// Fetch or create user in MongoDB
		userDoc, err := getOrCreateUser(c.Request.Context(), db, clerkUserID)
		log.Println("fetchin/creating user")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to authenticate user"})
			c.Abort()
			return
		}

		// Add user to request context (for GraphQL resolvers)
		ctx := context.WithValue(c.Request.Context(), usercontext.UserCtxKey, userDoc)
		c.Request = c.Request.WithContext(ctx)
		// log.Println(">>> User inserted into context:", userDoc.ClerkUserID)

		// Also set in Gin context for convenience
		c.Set("user", userDoc)

		c.Next()
	}
}

// ClerkAuthMiddleware (standard http.Handler version - keep for compatibility)
func ClerkAuthMiddleware(db *mongo.Database) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Remove "Bearer " prefix
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token == authHeader {
				http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
				return
			}

			// Verify token with Clerk
			claims, err := jwt.Verify(r.Context(), &jwt.VerifyParams{
				Token: token,
			})
			if err != nil {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			// Get clerkUserId from claims
			clerkUserID := claims.Subject
			if clerkUserID == "" {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			// Fetch or create user in MongoDB
			userDoc, err := getOrCreateUser(r.Context(), db, clerkUserID)
			if err != nil {
				http.Error(w, "Failed to authenticate user", http.StatusInternalServerError)
				return
			}

			// Add user to context
			ctx := context.WithValue(r.Context(), usercontext.UserCtxKey, userDoc)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// getOrCreateUser fetches existing user or creates new one
func getOrCreateUser(ctx context.Context, db *mongo.Database, clerkUserID string) (*UserDoc, error) {
	// log.Println("Getting or creating user for Clerk ID:", clerkUserID)
	coll := db.Collection("User")

	var user UserDoc
	err := coll.FindOne(ctx, bson.M{"clerkUserId": clerkUserID}).Decode(&user)

	// User exists
	if err == nil {
		return &user, nil
	}

	// Error other than not found
	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Create new user
	user = UserDoc{
		ClerkUserID: clerkUserID,
		CreatedAt:   time.Now(),
	}

	result, err := coll.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	user.ID = result.InsertedID.(bson.ObjectID)
	return &user, nil
}

// GetUserFromContext retrieves user from request context
func GetUserFromContext(ctx context.Context) (*UserDoc, error) {
	user, ok := ctx.Value(usercontext.UserCtxKey).(*UserDoc)
	if !ok || user == nil {
		return nil, errors.New("user not found in context")
	}
	return user, nil
}
