package websockets

import (
	"sync"
	"encoding/json"
)

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

	//roomId represents the project which is uniquely identified
	roomId string

	//register new client
	register chan *Client

	//unregister existing client
	unregister chan *Client

	//broadcast incoming messages
	broadcast chan BroadcastMessage 

	//Hub manager
	hubManager *HubManager

	//Needs while getting and transfering messages
	mu sync.RWMutex
}

// Messages to be sent
type BroadcastMessage struct {
	Sender *Client 					`json:"-"` //ignore this part 
	Data   json.RawMessage  `json:"content"`
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
		clients:    make(map[*Client]bool),
		roomId:     "",
		register:   make(chan *Client, 10), //buffered channel to prevent deadlock
		unregister: make(chan *Client, 5),
		broadcast:  make(chan BroadcastMessage, 50),
	}
}

/* This is the main loop of the running Hub */
func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.clients[c] = true

		case c := <-h.unregister:
			delete(h.clients, c)
			close(c.send)
			if len(h.clients) == 0 { delete(h.hubManager.hubs, h.roomId) }

			// handle broadcast events. support either:
			// - BroadcastMessage{Sender, Data}: forward to all clients except Sender
		case msg := <-h.broadcast:
			for client := range h.clients {
				if client.id == msg.Sender.id{continue} 
				client.send <- msg.Data
			}
		}
	}
}

func (hm *HubManager) GetExistingHubOrNewHub(roomId string) (*Hub) {
	// Handle create explicitly respecting provided roomId; otherwise generate new id.
		var h *Hub
		if h, ok := hm.hubs[roomId]; ok {
			return h
		}
		h = hm.CreateNewHub(roomId)
		return h
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
