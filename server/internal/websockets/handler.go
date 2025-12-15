package websockets 

import (
	"net/http"

	"github.com/gorilla/websocket"
)

/* upgrader upgrades our http connection to weboskcet connection */
var upgrader = &websocket.Upgrader{
	// Make origins stronglater
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		//add frontend or prod domain here
		if origin == "http://localhost:5173" || origin == "http://localhost:8080" {
		return true 
		}
		return false
	},
}
