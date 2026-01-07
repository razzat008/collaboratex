package websockets

import (
	"encoding/json"
	"json"
)

type Message struct {
	Client 	*Client   		 `json:"-"` //ignore this field during marshaling
	Type 		string				 `json:"type"`
	Text    string         `json:"text"`
	Version int						 `json:"version,omitempty"`
	Updates []ClientUpdate `json:"updates,omitempty"`
} 

type ClientUpdate struct{ 
	ClientId string    `json:"clientId"`
	Changes  string 	 `json:"changes"` //json rep of changes
}

/* This struct is used by the hub to store the current changes */
type DocumentState struct{ 
	Text string							
	Version int
	History []ClientUpdate
}

func NewDoc() DocumentState{
	return DocumentState{
		Text: "",
		Version: 0,
		History: make([]ClientUpdate, 0),
	}
}


func HandleMessage(msg Message, h *Hub){ 
	switch msg.Type{
	case "getDocument":
		HandleGetDocument(msg, h)	
	case "pullUpdates":
		HandlePullUpdates(msg, h)
	case "pushUpdates":
		HandlePushUpdates(msg, h)
	default:
		//invalid type
	}
}

func HandleGetDocument(msg Message, h *Hub){
	h.mu.Lock()
	defer h.mu.Unlock()

	doc := h.DocState

	resp := Message{
		Type: "document",	
		Version: doc.Version,
		Text: doc.Text,
	}

	jsonRespStr, err := json.Marshal(resp)
	if err != nil {
		//handle the error
	}
	msg.Client.send <- jsonRespStr
}

func HandlePullUpdates(msg Message, h *Hub) {}
func HandlePushUpdates(msg Message, h *Hub){}
