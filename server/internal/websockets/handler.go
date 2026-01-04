package websockets 

import (
	"net/http"
	"github.com/gin-gonic/gin"
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

/* websocket handler that is used to initiate the websocket connection */
//api eg: ws://localhost:8080/ws?action=join&room_id=abcd1234
//api eg: ws://localhost:8080/ws?action=create
func AuthenticatedWSHandler(hub *Hub) gin.HandlerFunc {
	return func(ctx *gin.Context){ 
		//Todo: only provide entry to validated user

		//checking if the request for websocket is upgrade or not
		if !websocket.IsWebSocketUpgrade(ctx.Request){ 
			ctx.JSON(http.StatusBadRequest,gin.H{"error":"Expected websocket upgrade"})
			return
		}

		//upgrading the websocket connection
		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			ctx.AbortWithStatus(http.StatusBadRequest)
			// Important: DO NOT call c.JSON() here.
			// WebSocket handshake already writes headers, so just return
			return
		}

		/* This is just a default test client and hub*/
		client := &Client{
			id : GenerateRoomID(), 	//just generate id
			name : "someone",
			hub : hub,
			connection :conn,
			send 	:make(chan []byte, 256),
			ready: true, 
		}
		/* end */

		client.hub.register <- client

		go client.Read()
		go client.Write()
		//Retrieving project id and so on from the url
	}
}
