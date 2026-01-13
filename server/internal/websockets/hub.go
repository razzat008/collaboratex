package websockets

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"
)

/*
What this file actually contains:
- A project has a hub where multiple clients resides.
- Each project contains a single document.
- This hub is responsible for relaying changes or client joins
*/

/* Hub manager manages all the hubs */
/* Todo It needs modification as it might store on db probably */
type HubManager struct {
	hubs map[string]*Hub //Unique id associated with a hub
	mu   sync.RWMutex
}

/*
Hub indicates a single project responsible for giving clients
the access
*/
type Hub struct {
	// All connected clients
	clients map[*Client]bool

	// lightweight map of client metadata (client id -> display name)
	// used to produce presence snapshots for new clients and for tooling/UIs.
	clientsMeta map[string]string

	//roomId represents the project which is uniquely identified
	roomId string

	//register new client
	register chan *Client

	//unregister existing client
	unregister chan *Client

	//broadcast incoming messages
	// accepts either raw []byte (legacy) or a `BroadcastMessage` struct that
	// includes the sending client. Using `interface{}` keeps backward compat
	// while allowing sender-aware broadcasts (so we can avoid echoing to sender).
	broadcast chan interface{}

	//Hub manager
	hubManager *HubManager

	//Needs while getting and transfering messages
	mu sync.RWMutex
}

type BroadcastMessage struct {
	Sender *Client
	Data   []byte
}

// Generate a roomId
func GenerateRoomID() string {
	data := make([]byte, 16)
	rand.Read(data)
	return hex.EncodeToString(data)
}

// Initializes a new hub manager
func NewHubManager() *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
	}
}

// Initializes a new hub
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		clientsMeta: make(map[string]string),
		roomId:      "",
		register:    make(chan *Client, 100), //buffered channel to prevent deadlock
		unregister:  make(chan *Client, 5),
		broadcast:   make(chan interface{}, 10),
	}
}

/* This is the main loop of the running Hub */
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			// register the client
			h.clients[c] = true
			// store metadata for presence snapshot
			if c.id != "" {
				h.clientsMeta[c.id] = c.name
			}

			// Send a presence snapshot to the newly connected client so it
			// can render currently-online users immediately.
			// Snapshot format: { type: "system", event: "presence_snapshot", clients: [{client_id, name}, ...] }
			snapshot := map[string]interface{}{
				"type":    "system",
				"event":   "presence_snapshot",
				"room":    h.roomId,
				"clients": []map[string]string{},
				"time":    time.Now().UTC().Format(time.RFC3339),
			}
			clientsList := []map[string]string{}
			for id, name := range h.clientsMeta {
				clientsList = append(clientsList, map[string]string{"client_id": id, "name": name})
			}
			snapshot["clients"] = clientsList
			if b, err := json.Marshal(snapshot); err == nil {
				// best-effort: send snapshot only to new client
				select {
				case c.send <- b:
				default:
					// if the client's send channel is full, drop snapshot (client will receive join messages)
				}
			}

			// Broadcast a join message to all clients (including the new one).
			joinMsg := map[string]interface{}{
				"type":      "system",
				"event":     "join",
				"client_id": c.id,
				"name":      c.name,
				"room":      h.roomId,
				"time":      time.Now().UTC().Format(time.RFC3339),
			}
			if b, err := json.Marshal(joinMsg); err == nil {
				for client := range h.clients {
					// best-effort non-blocking to avoid stalling the hub
					select {
					case client.send <- b:
					default:
					}
				}
			}

		case c := <-h.unregister:
			// remove client from maps and notify others
			delete(h.clients, c)
			if c.id != "" {
				delete(h.clientsMeta, c.id)
			}
			close(c.send)

			leaveMsg := map[string]interface{}{
				"type":      "system",
				"event":     "leave",
				"client_id": c.id,
				"name":      c.name,
				"room":      h.roomId,
				"time":      time.Now().UTC().Format(time.RFC3339),
			}
			if b, err := json.Marshal(leaveMsg); err == nil {
				for client := range h.clients {
					select {
					case client.send <- b:
					default:
					}
				}
			}

		// handle broadcast events. support either:
		// - []byte (legacy): forward to all clients
		// - BroadcastMessage{Sender, Data}: forward to all clients except Sender
		case rawMsg := <-h.broadcast:
			switch m := rawMsg.(type) {
			case BroadcastMessage:
				// sender-aware broadcast: skip the sender
				if m.Data == nil {
					continue
				}
				log.Println("broadcasting (from sender):", string(m.Data))
				for client := range h.clients {
					if client == m.Sender {
						continue
					}
					// best-effort, avoid blocking the hub if the client's send channel is full
					select {
					case client.send <- m.Data:
					default:
					}
				}
			case *BroadcastMessage:
				if m.Data == nil {
					continue
				}
				log.Println("broadcasting (from sender ptr):", string(m.Data))
				for client := range h.clients {
					if client == m.Sender {
						continue
					}
					select {
					case client.send <- m.Data:
					default:
					}
				}
			case []byte:
				// Legacy broadcast: forward to all clients.
				// However, avoid rebroadcasting a client-originated `leave` system message
				// because unregister path also sends a leave; dropping here prevents duplicates.
				if isSystemLeave(m) {
					// drop this broadcast because it will be handled on unregister
					continue
				}
				log.Println("broadcasting:", string(m))
				for client := range h.clients {
					select {
					case client.send <- m:
					default:
					}
				}
			default:
				// unknown message type; ignore
			}
		}
	}
}

func (hm *HubManager) GetExistingHubOrNewHub(action Action, roomId string) (*Hub, error) {
	// Handle create explicitly respecting provided roomId; otherwise generate new id.
	switch action {
	case CreateAction:
		// If caller provided a roomId, try to create hub with that id.
		if roomId != "" {
			// Check existence while holding the lock, but do not call CreateNewHub
			// while holding the lock to avoid re-entrant locking / deadlock.
			hm.mu.Lock()
			_, exists := hm.hubs[roomId]
			hm.mu.Unlock()
			if exists {
				return nil, errors.New("room already exists")
			}
			// Safe to create the hub now without holding the lock.
			h := hm.CreateNewHub(roomId)
			return h, nil
		}
		// No roomId provided: generate a unique one
		for {
			newRoomId := GenerateRoomID()
			hm.mu.RLock()
			_, exists := hm.hubs[newRoomId]
			hm.mu.RUnlock()
			if !exists {
				h := hm.CreateNewHub(newRoomId)
				return h, nil
			}
		}

	case JoinAction:
		if roomId == "" {
			return nil, errors.New("room id required for join action")
		}
		hm.mu.RLock()
		hub, ok := hm.hubs[roomId]
		hm.mu.RUnlock()
		if ok {
			return hub, nil
		}
		return nil, errors.New("the given room id doesn't exist")

	case DeleteAction:
		/*
			DeleteAction can only be performed by the owner which should
			be added in the hub so to remove unnecessary complexities for
			now I am leaving it
		*/

	default:
		return nil, errors.New("invalid action type in the query string")
	}
	// Fallback: should not be reached because each switch branch returns or creates a hub,
	// but provide an explicit return so the function is well-formed for the compiler.
	return nil, errors.New("no hub returned for action")
}

// This sets up hub and sends new goroutine to run main hub loop
func (hm *HubManager) CreateNewHub(roomId string) *Hub {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	//creating new hub
	newHub := NewHub()
	newHub.roomId = roomId
	newHub.hubManager = hm

	//associating new hub with hubmanager
	hm.hubs[newHub.roomId] = newHub
	go newHub.Run()

	return newHub
}

// isSystemLeave inspects a binary payload and returns true when it looks like
// a JSON system leave message. This is used to avoid rebroadcasting leave
// messages that are already handled by the unregister path.
func isSystemLeave(b []byte) bool {
	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		return false
	}
	// Check for {"type":"system","event":"leave", ...}
	t, ok := m["type"].(string)
	if !ok || t != "system" {
		return false
	}
	e, ok := m["event"].(string)
	if !ok {
		return false
	}
	return e == "leave"
}
