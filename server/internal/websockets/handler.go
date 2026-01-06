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
func AuthenticatedWSHandler(hm *HubManager) gin.HandlerFunc {
	return func(ctx *gin.Context){ 
		//Todo: only provide entry to validated user

		//checking if the request for websocket is upgrade or not
		if !websocket.IsWebSocketUpgrade(ctx.Request){ 
			ctx.JSON(http.StatusBadRequest,gin.H{"error":"Expected websocket upgrade"})
			return
		}

		//Names are taken after auth sessions
		name := ""
		if  name == ""{
			name = "Someone"
		}
		
		// Assign a unique Id when user is created(auth job)
		//and get id from the auth session but for testing purpose
		id := GenerateRoomID() //Todo: remove this (just for testing)

		action := Action(ctx.Query("action"))
		hub, err := hm.GetExistingHubOrNewHub(action)
		if err != nil { return /*Todo */ }


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
			id : id,//just generate id
			name : name,
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

