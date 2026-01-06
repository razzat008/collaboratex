/* defines all the actions that can be done */
package websockets 

import (

)

type Action string

const (
	JoinAction Action = "join" 			//join an existing project 
	CreateAction Action = "create" 	//join a new project
	DeleteAction Action = "delete"  //delete an existing project
)
