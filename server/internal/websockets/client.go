/* 
Defines the expected behaviour of the client
*/
package websockets

import(
	"github.com/gorilla/websocket"
)

type Client struct {
	id 	string 	//an unique identifier associated with client
	name string //name of the client
	hub *Hub //reference to a hub
	connection *websocket.Conn //actual websocket connection
	send 		chan []byte //channel for outgoing messages
	ready 	bool
}

/* There is read and write operation for each clinet in seperate goroutine */ 
/* reads the input from the client (input i.e client -> server) */
func (c *Client)Read(){ 

}

/* writes the output from server to client (i.e server -> client) */
func (c *Client)Write(){ 
}
