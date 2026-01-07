/*
Defines the expected behaviour of the client
*/
package websockets

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

//For heartbeat
const ( 
	writeWait  = 10*time.Second
	pongWait 	 = 60*time.Second
	pingPeriod = (pongWait * 9)/10
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
/* reads the input from the client (Typescript)  */
func (c *Client)Read(){ 
	defer func(){ 
		c.hub.unregister <- c 	
		c.connection.Close()
		log.Println("closing client.Read")
	}()	

	//setting the connection's read limit to 4kb
	// Todo: overall websocket error handeling rather than discarding data 
	c.connection.SetReadLimit(4096) 
	_ = c.connection.SetReadDeadline(time.Now().Add(pongWait))
	c.connection.SetPongHandler(func(string) error { 
		_ = c.connection.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for { 
		//reading data from client's websocket
		_, data, err := c.connection.ReadMessage()
		if err != nil{ 
			log.Println("err:","while reading from connection",err)	
			break
		}

		var message Message
		message.Client = c
		if err := json.Unmarshal(data, &message); err != nil{ 
			log.Println("err","Error occured while unmarshaling",err)
			continue
		}

		c.hub.broadcast <- message 
	}
}


/* writes the output from server to client (i.e server -> client) */
func (c *Client) Write(){ 
	ticker := time.NewTicker(pingPeriod)
	defer func(){ 
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

			w, err := c.connection.NextWriter(websocket.TextMessage)
			if err != nil { 
				log.Println("err:","error while creating next writer", err)
				return
			}

			// writing into next writer
			if _, err := w.Write(message); err != nil { 
				log.Println("err:","while writing from the connection", err)
				_=w.Close()
				return 
			}

			//writing queued messages from the connection 
			//debug: if necessary
			n := len(c.send)
			for i:=0; i<n; i++ { 
				nextMsg := <-c.send
				if _, err := w.Write(nextMsg); err != nil { 
					log.Println("err:","error while writing big message")
					break	
				}
			}

			//closing connection
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.connection.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.connection.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				log.Println("error:","error while writing pingMessage", err)
				return
			}
		}
	}
}
