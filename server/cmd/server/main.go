package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"gollaboratex/server/internal/api/graph"
	"gollaboratex/server/internal/api/handlers"
	"gollaboratex/server/internal/api/handlers/download"
	"gollaboratex/server/internal/middleware"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"gollaboratex/server/internal/websockets"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"gollaboratex/server/internal/db"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
	mongoURI := os.Getenv("MONGODB_URI")
	port := os.Getenv("PORT")
	minio_username := os.Getenv("MINIO_USERNAME")
	minio_pass := os.Getenv("MINIO_PASS")

	if clerkSecretKey == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable required")
	}
	if mongoURI == "" {
		mongoURI = "mongodb://admin:admin123@localhost:27017/"
	}
	if port == "" {
		port = "8080"
	}

	// Initialize Clerk
	clerk.SetKey(clerkSecretKey)

	// Connect to MongoDB
	database, err := db.GetDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	ctx := context.Background()
	bucketName := "assets"

	minioClient, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4(minio_username, minio_pass, ""),
		Secure: false, // true in prod
	})
	if err != nil {
		log.Fatal("Failed to initialize MinIO:", err)
	}
	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		log.Fatal("Failed to check MinIO bucket:", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			log.Fatal("Failed to create MinIO bucket:", err)
		}
		log.Println("Created MinIO bucket:", bucketName)
	}

	// Create GraphQL resolver
	resolver := graph.NewResolver(database)

	// upload handler instance
	uploadHandler := &handlers.UploadHandler{
		DB:     database,
		Minio:  minioClient,
		Bucket: bucketName,
	}

	downloadHandler := &download.ProjectHandler{
		DB:     database,
		Minio:  minioClient,
		Bucket: bucketName,
	}

	// Configure GraphQL server with subscriptions support
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// Add transports
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Configure based on your CORS policy
				return true
			},
		},
	})

	// Add extensions
	srv.Use(extension.Introspection{})

	// Initialize Gin router
	r := gin.Default()

	// Setup CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "DELETE", "PUT"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Disposition", "Content-Length"},
		AllowCredentials: true,
	}))

	// yeta herumnata k k vairako xa yeso
	r.Use(func(ctx *gin.Context) {
		log.Println("Incoming request:", ctx.Request.Method, ctx.Request.URL.Path)
		ctx.Next()
	})

	// GraphQL Playground route (no auth required)
	r.GET("/", gin.WrapF(playground.Handler("GraphQL playground", "/query")))

	api := r.Group("/api")

	api.Use(middleware.GinClerkAuthMiddleware(database))
	{
		api.GET("/", gin.WrapF(playground.Handler("GraphQL playground", "/api/query")))
		api.POST("/query", func(c *gin.Context) {
			srv.ServeHTTP(c.Writer, c.Request)
		})
	}

	uploads := api.Group("/uploads")
	{
		uploads.POST("/file", uploadHandler.UploadSingleFile)
		uploads.POST("/zip", uploadHandler.UploadZIP)
	}

	downloads := api.Group("/downloads")
	{
		downloads.GET("/project/:id", downloadHandler.DownloadProject)
	}

	assets := api.Group("/assets")
	{
		assets.GET("/:id", func(c *gin.Context) {
			c.JSON(http.StatusNotImplemented, gin.H{
				"error": "Asset download not yet implemented",
			})
		})
		assets.DELETE("/:id", func(c *gin.Context) {
			c.JSON(http.StatusNotImplemented, gin.H{
				"error": "Asset deletion not yet implemented",
			})
		})
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":   "ok",
			"database": "connected",
			"minio":    "connected",
		})
	})

	hm := websockets.NewHubManager()

	r.GET("/ws", websockets.AuthenticatedWSHandler(hm))

	log.Printf("Server starting on http://localhost:%s/", port)
	log.Printf("GraphQL Playground: http://localhost:%s/", port)
	log.Printf("GraphQL Endpoint: http://localhost:%s/query", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
