/* 
What this file actually contains: 
- A project has a hub where multiple clients resides. 
- Each project contains a single document.
- This hub is responsible for relaying changes or client joins
*/

package websockets

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
	broadcast chan Message
}
