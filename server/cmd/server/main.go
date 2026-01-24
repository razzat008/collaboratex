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
	"gollaboratex/server/internal/websockets"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	// "gollaboratex/server/internal/websockets"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"gollaboratex/server/internal/db"
	"gollaboratex/server/internal/worker"

	"github.com/joho/godotenv"

	// Added for worker runtime
	"github.com/docker/docker/client"
	"github.com/go-redis/redis/v8"
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

	// Connect to MongoDB (returns client and database)
	mongoClient, database, err := db.GetDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	// ensure we disconnect on shutdown
	defer func() {
		_ = mongoClient.Disconnect(context.Background())
	}()

	ctx := context.Background()
	bucketName := "assets"

	minioClient, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4(minio_username, minio_pass, ""),
		Secure: false, // true in prod
	})
	if err != nil {
		log.Fatal("Failed to initialize MinIO:", err)
	}

	// Ensure required buckets exist before starting the worker:
	// - assets (existing)
	// - compile-sources (where inline uploads are stored)
	// - compile-logs (worker uploads logs here)
	// - compiled-pdfs (worker uploads produced PDFs here)
	requiredBuckets := []string{
		bucketName,
		"compile-sources",
		"compile-logs",
		"compiled-pdfs",
	}
	for _, b := range requiredBuckets {
		exists, err := minioClient.BucketExists(ctx, b)
		if err != nil {
			log.Fatalf("Failed to check MinIO bucket %s: %v", b, err)
		}
		if !exists {
			if err := minioClient.MakeBucket(ctx, b, minio.MakeBucketOptions{}); err != nil {
				log.Fatalf("Failed to create MinIO bucket %s: %v", b, err)
			}
			log.Printf("Created MinIO bucket: %s", b)
		}
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

	// Initialize Redis (for job queue)
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	// Initialize Docker client (used to run tectonic compiler containers)
	dockerCli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Failed to initialize Docker client: %v", err)
	}

	// Worker configuration (tune as needed or drive from env)
	dockerImage := os.Getenv("TECTONIC_IMAGE")
	if dockerImage == "" {
		// Prefer TEXLIVE_IMAGE as a fallback if TECTONIC_IMAGE is not set.
		dockerImage = os.Getenv("TEXLIVE_IMAGE")
	}
	if dockerImage == "" {
		// Final fallback if neither env var is set.
		dockerImage = "texlive-compiler:latest"
	}

	workerCfg := worker.Config{
		RedisQueueName:  "compile:queue",
		MongoDatabase:   database.Name(),
		JobCollection:   "compile_jobs",
		MinioBucketPDFs: "compiled-pdfs",
		DockerImage:     dockerImage,
		MemoryBytes:     750 << 20,
		NanoCPUs:        500000000,
		Timeout:         60 * time.Second,
	}

	// Start the compile worker in background (server continues serving)
	go func() {
		if err := worker.Run(context.Background(), workerCfg, redisClient, mongoClient, minioClient, dockerCli); err != nil {
			log.Printf("worker exited: %v", err)
		}
	}()

	// Configure GraphQL server with subscriptions support
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// Add transports
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			// In upgrader
			CheckOrigin: func(r *http.Request) bool {
				// origin := r.Header.Get("Origin")
				// For development, allow all
				// if strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1") {
				// return true
				// }
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
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:1234"}, // Add your frontend URLs
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
	r.POST("/api/verify-token", handlers.VerifyTokenHandler(database))
	// Add to main.go for testing
	api := r.Group("/api")

	hm := websockets.NewHubManager()
	api.Use(middleware.GinClerkAuthMiddleware(database))
	{
		api.GET("/", gin.WrapF(playground.Handler("GraphQL playground", "/api/query")))
		api.POST("/query", func(c *gin.Context) {
			srv.ServeHTTP(c.Writer, c.Request)
		})

	}
	// main.go - Update the WebSocket routes section
	// ws := api.Group("/ws")
	// ws.Use(middleware.GinClerkAuthMiddleware(database)) // <-- Use the new middleware
	// {
	// 	ws.GET("/:room", websockets.AuthenticatedWSHandler(hm))
	// }
	r.GET("ws/:room", websockets.AuthenticatedWSHandler(hm))

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

	// Register worker HTTP handlers (compile endpoints) on a public API group so
	// the frontend can POST compile jobs and poll status. These endpoints are
	// intentionally registered without Clerk auth for now (use a different group
	// or add the middleware if you want them protected).
	// Ensure the job collection name matches workerCfg.JobCollection.
	jobColl := database.Collection(workerCfg.JobCollection)
	compileHandler := worker.NewHandler(
		redisClient,
		minioClient,
		jobColl,
		workerCfg.RedisQueueName,
		workerCfg.MinioBucketPDFs, // Removed logsBucket parameter
	)

	// Register compile endpoints directly under /api paths (public).
	// Doing direct registrations avoids potential router group ordering issues.
		r.POST("/api/compile-inline", compileHandler.EnqueueCompileInline)
		r.POST("/api/compile", compileHandler.EnqueueCompile)
		r.GET("/api/compile/:id", compileHandler.GetJobStatus)
		r.GET("/api/:id/logs", compileHandler.GetJobLogs) // New: Get logs separately
		r.GET("/api/compile/:id/pdf", compileHandler.DownloadPDF) // New: Download PDF directly
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		// Test Redis connection
		redisStatus := "disconnected"
		if err := redisClient.Ping(context.Background()).Err(); err == nil {
			redisStatus = "connected"
		}

		c.JSON(200, gin.H{
			"status":   "ok",
			"database": "connected",
			"minio":    "connected",
			"redis":    redisStatus,
		})
	})

	log.Printf("Server starting on http://localhost:%s/", port)
	log.Printf("GraphQL Playground: http://localhost:%s/", port)
	log.Printf("GraphQL Endpoint: http://localhost:%s/query", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
