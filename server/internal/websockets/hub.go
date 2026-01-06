package websockets

import( 
	"sync"
	"log"
	"crypto/rand"
	"encoding/hex"
	"errors"
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
	hubs map [string]*Hub //Unique id associated with a hub
	mu   sync.RWMutex
}

/* 
Hub indicates a single project responsible for giving clients 
the access
*/
type Hub struct{ 
	// All connected clients
	clients map[*Client]bool

	//roomId represents the project which is uniquely identified
	roomId string

	//register new client
	register chan *Client

	//unregister existing client
	unregister chan *Client

	//broadcast incoming messages
	broadcast chan Document 

	//Hub manager
	hubManager *HubManager
}

//Generate a roomId 
func GenerateRoomID() string { 
	data := make([]byte, 16)
	rand.Read(data)
	return hex.EncodeToString(data)
}

// Initializes a new hub manager
func NewHubManager() *HubManager{ 
	return &HubManager{
		hubs: make(map[string]*Hub),
	}
}

// Initializes a new hub
func NewHub() *Hub{ 
	return &Hub { 
		clients: make(map[*Client]bool),
		roomId:  "", //Need to make a sharing link to generate roomId
		register: make(chan *Client, 100), //buffered channel to prevent deadlock
		unregister: make(chan *Client, 5),
		broadcast:  make(chan Document, 10), //Need to lookinto it
	}
}

/* This is the main loop of the running Hub */
func (h *Hub) Run (){
	for {
		select { 
		case c := <-h.register:
			h.clients[c] = true
			/* Todo: if new clients arrives we might have to 
			broadcast this info */
		case c := <-h.unregister:
			h.clients[c] = false
			/* Todo: broadcast the client leaving */
		case document := <- h.broadcast:
			for client := range h.clients{ 
				if client.id == document.sender { continue }
				client.send <- []byte(document.Content) //most shittiest code
				log.Println("broadcasting:",string(document.Content))
			}
		}
	}
}

func (hm *HubManager)GetExistingHubOrNewHub(action Action, roomId string) (*Hub, error) {
	h := NewHub()
	switch action { 
	case CreateAction:
		/* todo: might be a better way to achieve it */
		for {
			roomId := GenerateRoomID()
			if _, ok := hm.hubs[roomId]; !ok{ 
				h = hm.CreateNewHub(roomId)
				break
			}
		}

	case JoinAction:
		if hub, ok := hm.hubs[roomId]; ok { 
			h = hub
		}else { 
			return nil, errors.New("The Given roomId dosen't exists") 
		}
	case DeleteAction:
		/*
			DeleteAction can only be performed by the owner which should 
			be added in the hub so to remove unnecessary complexities for 
			now I am leaving it
		*/

	default:
		return nil, errors.New("Invalid action type in the query string")
	}
	return h, nil
}


//Creating new hub
func (hm *HubManager)CreateNewHub(roomId string) *Hub {
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
