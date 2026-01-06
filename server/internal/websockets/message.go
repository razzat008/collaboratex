package websockets

type Message struct {
	Type 		string				 `json:"type"`
	Version int						 `json:"version,omitempty"`
	Updates []ClientUpdate `json:"updates,omitempty"`
} 

type ClientUpdate struct{ 
	ClientId string    `json:"clientId"`
	Changes  string 	 `json:"changes"` //json rep of changes
}

type DocumentState struct{ 
	Text string
	Version int
	History []ClientUpdate
}
