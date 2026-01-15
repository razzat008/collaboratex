package websockets

import (
	"gollaboratex/server/internal/middleware"
	"log"
	"net/http"
	"net/url"
	"strings"

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
		// Require that authentication middleware has already populated request context.
		// We use the same user type placed into the context by middleware.GinClerkAuthMiddleware.
		user, err := middleware.GetUserFromContext(ctx.Request.Context())
		if err != nil {
			log.Println("WS auth failed: user not found in context")
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
			return
		}

		// checking if the request for websocket is upgrade or not
		// Log basic request info to help debugging handshake failures.
		log.Println("WS handler invoked:", "Method=", ctx.Request.Method, "URL=", ctx.Request.URL.String(), "RemoteAddr=", ctx.Request.RemoteAddr)
		log.Println("WS headers: Origin=", ctx.Request.Header.Get("Origin"), "Host=", ctx.Request.Host, "Upgrade=", ctx.Request.Header.Get("Upgrade"))
		if !websocket.IsWebSocketUpgrade(ctx.Request) {
			log.Println("WS upgrade refused: not a websocket upgrade")
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Expected websocket upgrade"})
			return
		}

		// Prefer an explicit display name provided by the client, otherwise derive from authenticated user.
		//once Need to get the username
		var name string
			if user.ClerkUserID != "" {
				name = user.ClerkUserID
			} else {
				name = "Anynomous"
			}
		log.Println("Connecting client name:", name)

		// Use authenticated user's ClerkUserID as the client id (stable across connections).
		id := user.ClerkUserID
		log.Println("Assigned client id:", id)

		// Determine canonical room/project id.
		// Prefer a value injected by upstream middleware (e.g. project lookup middleware).
		var roomId string
		if v, ok := ctx.Get("project_id"); ok {
			if s, ok2 := v.(string); ok2 {
				roomId = s
			}
		}
		// Fallbacks: path param then query param
		if roomId == "" {
			roomId = ctx.Param("room")
		} else if roomId == "" {
			roomId = ctx.Query("room_id")
		} else {
			roomId = "testRoomId"
		}
		// Log selected room id for debugging
		log.Println("Requested room id:", roomId)

		// Validate and obtain hub using canonical room id (resolved/authorized by middleware if available).
		hub := hm.GetExistingHubOrNewHub(roomId)
		log.Println("Obtained hub for room:", hub.roomId)

		// Attempt to upgrade the HTTP request to a websocket connection.
		// Log the incoming request details to help debug handshake failures.
		log.Printf("Attempting WS upgrade: Path=%s RemoteAddr=%s Origin=%s", ctx.Request.URL.Path, ctx.Request.RemoteAddr, ctx.Request.Header.Get("Origin"))
		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			// Log the upgrade failure with details so developers can diagnose issues
			log.Printf("WebSocket upgrade failed: RemoteAddr=%s Origin=%s Error=%v", ctx.Request.RemoteAddr, ctx.Request.Header.Get("Origin"), err)
			// Handshake failed — return a 400 to the client. Do not write JSON after upgrade attempt.
			ctx.AbortWithStatus(http.StatusBadRequest)
			return
		}

		// Debug: log successful websocket upgrade so we can verify which clients connect
		// and which room/action they are requesting.
		log.Printf("WS upgrade OK from %s — room=%s  user=%s\n", ctx.Request.RemoteAddr, roomId, user.ClerkUserID)

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
