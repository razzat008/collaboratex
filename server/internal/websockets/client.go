/*
Defines the expected behaviour of the client
*/
package websockets

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// For heartbeat
const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Client struct {
	id         string          //an unique identifier associated with client
	name       string          //name of the client
	hub        *Hub            //reference to a hub
	connection *websocket.Conn //actual websocket connection
	send       chan []byte     //channel for outgoing messages
	ready      bool
}

/* There is read and write operation for each clinet in seperate goroutine */
/* reads the input from the client (Typescript)  */
func (c *Client) Read() {
	defer func() {
		c.hub.unregister <- c
		c.connection.Close()
		log.Println("closing client.Read")
	}()

	// The connection read limit to 64kb
	c.connection.SetReadLimit(65536)
	_ = c.connection.SetReadDeadline(time.Now().Add(pongWait))
	c.connection.SetPongHandler(func(string) error {
		_ = c.connection.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		// reading data from client's websocket
		msgtype, data, err := c.connection.ReadMessage()
		if err != nil {
			log.Println("err:", "while reading from connection", err)
			break
		}

		if msgtype == websocket.BinaryMessage {
			select {
			case c.hub.broadcast <- BroadcastMessage{Sender: c, Data: data}:
			default:
				log.Println("warning: dropping broadcast message, hub channel full")
			}
		}
	}
}

/* writes the output from server to client (i.e server -> client) */
func (c *Client) Write() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.connection.Close()
		log.Println("closing client.write")
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.connection.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.connection.WriteMessage(websocket.CloseMessage, []byte{})
				log.Printf("send channel closed for user")
				return
			}

			// Write each outgoing message as its own BinaryMessage frame.
			// This preserves message boundaries which Yjs and awareness payloads rely on.
			if err := c.connection.WriteMessage(websocket.BinaryMessage, message); err != nil {
				log.Println("err:", "while writing message to the connection", err)
				return
			}

		case <-ticker.C:
			_ = c.connection.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Println("error:", "error while writing pingMessage", err)
				return
			}
		}
	}
}
