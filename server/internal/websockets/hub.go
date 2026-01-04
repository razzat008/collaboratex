package websockets

import( 
	"sync"
	"log"
	"crypto/rand"
	"encoding/hex"
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
