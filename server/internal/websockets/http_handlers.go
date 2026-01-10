package websockets

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterHTTPHandlers registers simple HTTP endpoints to create and check rooms.
// These are intended for local testing (Postman, curl) and do not perform auth or
// persistence. They operate on the in-memory HubManager used by the websocket handlers.
//
// Routes added:
//   - POST /api/rooms         -> create a room. JSON body optionally { "room_id": "<id>" }.
//     If no room_id provided, a new random id is generated.
//   - GET  /api/rooms/:room_id -> check whether a room exists. Returns { "exists": true/false }.
func RegisterHTTPHandlers(hm *HubManager, router *gin.Engine) {
	router.POST("/api/rooms", CreateRoomHandler(hm))
	router.GET("/api/rooms/:room_id", CheckRoomHandler(hm))
}

// CreateRoomHandler returns a handler that creates a new in-memory hub (room).
// Request body (optional): { "room_id": "room42" }
// Response:
//   - 201 { "ok": true, "room_id": "..." } on success
//   - 400 { "error": "room already exists" } if provided id already exists
//   - 500 on unexpected errors
func CreateRoomHandler(hm *HubManager) gin.HandlerFunc {
	type reqBody struct {
		RoomID string `json:"room_id"`
	}
	type respBody struct {
		OK     bool   `json:"ok"`
		RoomID string `json:"room_id,omitempty"`
		Error  string `json:"error,omitempty"`
	}

	return func(ctx *gin.Context) {
		var body reqBody
		if err := ctx.BindJSON(&body); err != nil {
			// If no JSON provided that's ok; we'll generate an id
			// But if an invalid JSON was provided, respond with Bad Request
			if ctx.Request.ContentLength > 0 {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
				return
			}
		}

		roomId := body.RoomID
		if roomId != "" {
			// check existence
			hm.mu.RLock()
			_, exists := hm.hubs[roomId]
			hm.mu.RUnlock()
			if exists {
				ctx.JSON(http.StatusBadRequest, respBody{OK: false, Error: "room already exists"})
				return
			}
			// create with provided id
			hub := hm.CreateNewHub(roomId)
			if hub == nil {
				log.Printf("failed to create hub for room: %s", roomId)
				ctx.JSON(http.StatusInternalServerError, respBody{OK: false, Error: "failed to create room"})
				return
			}
			ctx.JSON(http.StatusCreated, respBody{OK: true, RoomID: roomId})
			return
		}

		// No room id provided: generate one and create
		newId := GenerateRoomID()
		hub := hm.CreateNewHub(newId)
		if hub == nil {
			log.Printf("failed to create hub for generated room id")
			ctx.JSON(http.StatusInternalServerError, respBody{OK: false, Error: "failed to create room"})
			return
		}
		ctx.JSON(http.StatusCreated, respBody{OK: true, RoomID: newId})
	}
}

// CheckRoomHandler returns a handler that reports whether a room exists.
// Response: 200 { "exists": true } or { "exists": false }
func CheckRoomHandler(hm *HubManager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roomId := ctx.Param("room_id")
		if roomId == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "room_id required in path"})
			return
		}

		hm.mu.RLock()
		_, exists := hm.hubs[roomId]
		hm.mu.RUnlock()

		ctx.JSON(http.StatusOK, gin.H{"exists": exists})
	}
}
