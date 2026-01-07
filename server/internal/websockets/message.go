package websockets

import (
	"encoding/json"
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

	jsonRespStr, err := IntoJson(resp)
	if err !=nil {
		//handle error
	}

	msg.Client.send <- jsonRespStr
}

func HandlePullUpdates(msg Message, h *Hub) {
	h.mu.Lock()
	defer h.mu.Unlock()

	//while pulling version should not be greater
	if msg.Version > h.DocState.Version {
		return
	}

	missing := h.DocState.History[msg.Version:]

	resp := Message{
		Type:    "updates",
		Updates: missing,
	}

	jsonStr, err := IntoJson(resp)
	if err != nil { /* Handle error */ }

	msg.Client.send <- jsonStr
}

func HandlePushUpdates(msg Message, h *Hub){
	h.mu.Lock()
	defer h.mu.Unlock()

	// because we cannot make invalid incomplete changes
	if msg.Version != h.DocState.Version{
		return
	}

	for _, update := range msg.Updates{
		// Apply change (placeholder)
		h.DocState.Text += update.Changes // you’ll replace this later
		h.DocState.History = append(h.DocState.History, update)
		h.DocState.Version++
	}

	out := Message{
		Type: "updates", 
		Updates: msg.Updates,
	}

	//broadcast the changes to everyone except sender
	for client ,_ := range h.clients{
		if msg.Client.id == client.id { continue }

		jsonStr, err := IntoJson(out)
		if err != nil { /* handle the error */ }

		client.send <- jsonStr
	}
}

//helper function to marshal the given struct into json
func IntoJson(resp Message) ([]byte, error){
	jsonString, err := json.Marshal(resp)
	if err != nil {
		return nil, err
	}
	return jsonString, nil
}


/* Todo : just stare at the implementation and think about the correctness the code */
// this is one of the core part of the code so no errors or race condition allowed
