package websockets

import( 
	"sync"
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
	hubs map [string]*Hub
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

}
