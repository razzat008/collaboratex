# collaboratex
        
      collaboratex is a web-based editor 


---

##  Architecture Overview

```
Client (React + Apollo)
   │
   ├── Queries / Mutations
   ├── Subscriptions (WebSocket)
   │
Server (GraphQL API)
   │
   ├── Auth Middleware
   ├── Resolvers
   ├── CRDT Merge Layer
   │
Database
```

---

##  Tech Stack

### Frontend

* **React**
* **Apollo Client**
* TypeScript
* TailwindCSS
* shadcn/ui

### Backend

* **Go**
* **GraphQL**
* gqlgen
* WebSocket subscriptions
* CRDT-based document merging

### Database

* MongoDB (projects, files, versions)
* Document-based storage

---

##  GraphQL API Design

### Core Concepts

* **Project** → container for files & versions
* **File** → metadata for LaTeX files
* **WorkingFile** → live editable content
* **Version** → snapshot of project state

### Example Mutation

```graphql
mutation CreateProject($input: NewProjectInput!) {
  createProject(input: $input) {
    id
    projectName
    createdAt
  }
}
```

---

##  Real-Time Editing Flow

1. User edits file
2. Client sends `updateWorkingFile` mutation
3. Server merges changes using CRDT
4. `workingFileUpdated` subscription broadcasts update
5. All connected clients sync instantly

---

##  Authentication Flow

1. User authenticates on frontend
2. Auth middleware validates request
3. User object injected into context
4. Resolvers extract user via `GetUserFromContext`
5. Authorization enforced at resolver level
