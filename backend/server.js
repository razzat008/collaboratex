import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRoutes from './routes/user_routes.js';
import uploadRoutes from './controllers/upload_controller.js';
import projectRoutes from './routes/project_routes.js';
import MessageQueue from './config/messageQueue.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
);

app.use("/", userRoutes);
app.use("/api/templates", uploadRoutes);
app.use("/api/projects", projectRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

const rooms = new Map();
const messageQueue = new MessageQueue();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("cursor-position", (data) => {
    const { roomId, cursorPosition } = data;
    socket.to(roomId).emit("cursor-position", {
      userId: socket.id,
      cursorPosition,
    });
  });

  socket.on("edit", (editData) => {
    messageQueue.enqueue({ event: "edit", data: editData });

    messageQueue.process((message) => {
      console.log("Processing message:", message);
      socket.to(editData.roomId).emit("edit", message.data);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

server.listen(port, () => {
  connectDB();
  console.log("Server started at http://localhost:" + port);
});


