package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"gollaboratex/server/internal/api/graph"
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

	"github.com/joho/godotenv"
	"gollaboratex/server/internal/db"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
	mongoURI := os.Getenv("MONGODB_URI")
	port := os.Getenv("PORT")

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

	// Create GraphQL resolver
	resolver := graph.NewResolver(database)

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
		AllowOrigins:     []string{"http://localhost:5173"}, // Add your frontend URLs
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "DELETE", "PUT"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// yeta herumnata k k vairako xa yeso
	r.Use(func(ctx *gin.Context) {
		log.Println("Incoming request:", ctx.Request.Method, ctx.Request.URL.Path)
		ctx.Next()
	})

	// GraphQL Playground route (no auth required)
	r.GET("/", gin.WrapF(playground.Handler("GraphQL playground", "/query")))

	api := r.Group("/")

	hm := websockets.NewHubManager()
	api.Use(middleware.GinClerkAuthMiddleware(database))
	{
		api.POST("/query", func(c *gin.Context) {
			srv.ServeHTTP(c.Writer, c.Request)
		})

	}
	r.GET("/ws", websockets.AuthenticatedWSHandler(hm))


	// GraphQL query endpoint (with auth middleware)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":   "ok",
			"database": "connected",
		})
	})


	log.Printf("Server starting on http://localhost:%s/", port)
	log.Printf("GraphQL Playground: http://localhost:%s/", port)
	log.Printf("GraphQL Endpoint: http://localhost:%s/query", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
