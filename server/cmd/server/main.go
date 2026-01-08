package main

import (
	"gollaboratex/server/internal/websockets"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	// Enable CORS for development so the browser can upgrade websockets from the dev origin(s).
	// Restrict these origins for production.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Initializing new hub manager
	hm := websockets.NewHubManager()

	// Register routes
	r.GET("/", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"test": "ok",
		})
	})

	//need to rewrite the routes a bit
	r.GET("/ws", websockets.AuthenticatedWSHandler(hm))
	r.GET("/ws/:room", websockets.AuthenticatedWSHandler(hm))

	// Run on port 8080 explicitly and log startup
	addr := ":8080"
	log.Printf("starting server on %s", addr)
	r.Run(addr)
}
