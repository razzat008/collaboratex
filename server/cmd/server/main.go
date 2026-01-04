package main

import (
	"gollaboratex/server/internal/websockets"
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {

	r := gin.Default()

	//Initializing new hub manager
	hm := websockets.NewHubManager()
	
	//current routes
	r.GET("/", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"test": "ok",
		})
	})
	r.GET("/ws", websockets.AuthenticatedWSHandler(hm))

	r.Run()

}
