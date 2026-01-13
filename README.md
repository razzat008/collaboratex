# gollaboratex
        
      gollaborateX is a web-based editor 

or\
_gollaborateX is a web-based collaborative LaTeX editor designed for real-time document editing, project-based organization, and versioned workflows. It enables multiple users to work on the same LaTeX project simultaneously with live updates, file management, and restoreable versions._

## ✨ Features

### 🗂 Project Management

* Create, delete, and manage LaTeX projects
* Add and remove collaborators
* Owner-based access control
* Dashboard with project listing

### 📁 File System

* Multiple files per project
* File creation, renaming, and deletion
* Working file abstraction for live editing
* Root file tracking

### ✍️ Real-Time Collaboration

* Live collaborative editing using **CRDT**
* Real-time updates via GraphQL subscriptions
* Conflict-free merging of document changes

### 🕒 Versioning System

* Create named versions (snapshots)
* Restore project state from any version
* Version-specific file history

### 🔐 Authentication & Authorization

* Auth middleware injects user into request context
* Resolver-level access control
* Only collaborators can mutate project data

---

## 🏗 Architecture Overview

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

## 🧱 Tech Stack

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

## 🔄 GraphQL API Design

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

## 🔁 Real-Time Editing Flow

1. User edits file
2. Client sends `updateWorkingFile` mutation
3. Server merges changes using CRDT
4. `workingFileUpdated` subscription broadcasts update
5. All connected clients sync instantly

---

## 🔐 Authentication Flow

1. User authenticates on frontend
2. Auth middleware validates request
3. User object injected into context
4. Resolvers extract user via `GetUserFromContext`
5. Authorization enforced at resolver level

---

## 🚀 Running the Project

### Backend

```bash
cd server
go mod tidy
go run cmd/server/main.go
```

### Frontend

```bash
cd client
pnpm install
pnpm run dev
```
