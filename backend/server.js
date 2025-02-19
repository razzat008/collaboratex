import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import connectDB from './config/db.js';
import userRoutes from './routes/user_routes.js';
import uploadRoutes from './controllers/upload_controller.js';
import projectRoutes from './routes/project_routes.js';
import fileRoutes from './routes/file_routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const TMP_DIR = path.join(__dirname, "tmp");

// Ensure `tmp/` directory exists
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// API Routes
app.use("/", userRoutes);
app.use("/api/templates", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", fileRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("file:edit", ({ fileId, content }) => {
    const filePath = path.join(TMP_DIR, `${fileId}.tex`);

    // Save updated content to the file
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log(`Updated ${fileId}.tex`);

      // Broadcast the change to all clients
      socket.broadcast.emit("file:update", content);
    });
  });

  socket.on("edit", async (editData) => {
    await publisher.publish("documentEdits", JSON.stringify(editData));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  connectDB();
  console.log(`Server started at http://localhost:${port}`);
});

