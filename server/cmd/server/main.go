package main

import (
	"gollaboratex/server/internal/websockets"
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {

	r := gin.Default()

		hub := websockets.NewHub()
		go hub.Run()

	r.GET("/", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"test": "ok",
		})
	})
	r.GET("/ws", websockets.AuthenticatedWSHandler(hub))

	r.Run()

}
