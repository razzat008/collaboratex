package websockets

import (
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
//api eg: ws://localhost:8080/ws?action=join&room_id=abcd1234
//api eg: ws://localhost:8080/ws?action=create
func AuthenticatedWSHandler(hm *HubManager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		//Todo: only provide entry to validated user

		// checking if the request for websocket is upgrade or not
		// Log basic request info to help debugging handshake failures.
		log.Println("WS handler invoked:", "Method=", ctx.Request.Method, "URL=", ctx.Request.URL.String(), "RemoteAddr=", ctx.Request.RemoteAddr)
		log.Println("WS headers: Origin=", ctx.Request.Header.Get("Origin"), "Host=", ctx.Request.Host, "Upgrade=", ctx.Request.Header.Get("Upgrade"))
		if !websocket.IsWebSocketUpgrade(ctx.Request) {
			log.Println("WS upgrade refused: not a websocket upgrade")
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Expected websocket upgrade"})
			return
		}

		// Names are taken after auth sessions; for now read optional `name` query param
		name := ctx.Query("name")
		if name == "" {
			name = "Someone"
		}
		log.Println("Connecting client name:", name)

		// Assign a unique Id when user is created (replace with auth-based id later).
		// This is useful for presence and debugging.
		id := GenerateRoomID() //Todo: remove this (just for testing)
		log.Println("Assigned temporary client id:", id)

		// Determine room id: prefer path parameter (/:room) and fall back to query param
		roomId := ctx.Param("room")
		if roomId == "" {
			roomId = ctx.Query("room_id")
		}
		// Log selected room id for debugging
		log.Println("Requested room id:", roomId)

		// Determine action (create/join). If not provided, prefer Join when a room is provided,
		// otherwise default to Create for convenience.
		action := Action(ctx.Query("action"))
		if action == "" {
			if roomId != "" {
				action = JoinAction
			} else {
				action = CreateAction
			}
		}
		// Log the requested action to help debugging
		log.Println("Requested action:", string(action))

		// Validate and obtain hub
		hub, err := hm.GetExistingHubOrNewHub(action, roomId)
		if err != nil {
			// Log the exact error for server-side debugging and return it to client
			log.Println("GetExistingHubOrNewHub error:", err.Error(), "action=", string(action), "roomId=", roomId)
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
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
		log.Printf("WS upgrade OK from %s — room=%s action=%s\n", ctx.Request.RemoteAddr, roomId, action)

		/* This is just a default test client and hub*/
		client := &Client{
			id:         id, //just generate id
			name:       name,
			hub:        hub,
			connection: conn,
			send:       make(chan []byte, 256),
			ready:      true,
		}
		/* end */

		client.hub.register <- client

		go client.Read()
		go client.Write()
	}
}
