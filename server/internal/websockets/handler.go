package websockets

import (
	"log"
	"net/http"
	"net/url"
	"strings"
	"strconv"
	"math/rand"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

/*
upgrader upgrades our http connection to weboskcet connection

	This CheckOrigin is intentionally permissive for local development:
	it logs handshake origins and accepts common local dev origins (localhost,
	127.0.0.1, ::1, 0.0.0.0) and empty origins. In production you should
	replace this with a strict whitelist.
*/
var upgrader = &websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Log the handshake attempt so we can diagnose cross-browser/dev host issues.
		log.Printf("WS handshake attempt: Origin=%q Host=%q RemoteAddr=%q", origin, r.Host, r.RemoteAddr)

		// Allow empty origin (non-browser clients, some dev tools)
		if origin == "" {
			return true
		}

		// Allow explicit well-known local dev origins
		if origin == "http://localhost:5173" || origin == "http://localhost:8080" ||
			origin == "http://127.0.0.1:5173" || origin == "http://127.0.0.1:8080" ||
			origin == "http://0.0.0.0:5173" || origin == "http://0.0.0.0:8080" {
			return true
		}

		// Fallback: parse origin and allow when hostname is a loopback or matches request host (helpful in dev)
		if u, err := url.Parse(origin); err == nil {
			host := u.Hostname()
			if host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "0.0.0.0" {
				return true
			}
			// allow when origin hostname equals the request host (stripping port)
			reqHost := r.Host
			if strings.Contains(reqHost, ":") {
				reqHost = strings.Split(reqHost, ":")[0]
			}
			if host == reqHost {
				return true
			}
		}

		// otherwise reject and log the rejection for easier debugging
		log.Printf("WS handshake rejected: Origin=%q Host=%q RemoteAddr=%q", origin, r.Host, r.RemoteAddr)
		return false
	},
}

/* websocket handler that is used to initiate the websocket connection */
func AuthenticatedWSHandler(hm *HubManager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		//check for websocket upgrade
		if !websocket.IsWebSocketUpgrade(ctx.Request) {
			log.Println("WS upgrade refused: not a websocket upgrade")
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Expected websocket upgrade"})
			return
		}

		//for every user just give the anynomous name
		name := "Anynomous"
		log.Println("Connecting client name:", name)

		//Assigining random Id to client
		id := strconv.FormatInt(rand.Int63(), 10)
		log.Println("Assigned client id:", id)

		// room Is just project id since
		roomId := ctx.Param("room")

		// Log selected room id for debugging
		log.Println("Requested room id:", roomId)

		// Validate and obtain hub using canonical room id.
		hub := hm.GetExistingHubOrNewHub(roomId)
		log.Println("Obtained hub for room:", hub.roomId)

		// Attempt to upgrade the HTTP request to a websocket connection.
		log.Printf("Attempting WS upgrade: Path=%s RemoteAddr=%s Origin=%s", ctx.Request.URL.Path, ctx.Request.RemoteAddr, ctx.Request.Header.Get("Origin"))
		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: RemoteAddr=%s Origin=%s Error=%v", ctx.Request.RemoteAddr, ctx.Request.Header.Get("Origin"), err)
			ctx.AbortWithStatus(http.StatusBadRequest)
			return
		}

		// Debug: log successful websocket upgrade so we can verify which clients connect
		// and which room/action they are requesting.
		log.Printf("WS upgrade OK from %s — room=%s  ", ctx.Request.RemoteAddr, roomId)

		// Create client using authenticated identity and resolved room/hub.
		client := &Client{
			id:         id,
			name:       name,
			hub:        hub,
			connection: conn,
			send:       make(chan []byte, 256),
			ready:      true,
		}

		// Register client and start read/write pumps.
		client.hub.register <- client

		go client.Read()
		go client.Write()
	}
}
