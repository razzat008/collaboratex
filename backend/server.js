import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import userRoutes from './routes/user_routes.js';
import uploadRoutes from './controllers/upload_controller.js';
import projectRoutes from './routes/project_routes.js'
import fileRoutes from './routes/file_routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use("/", userRoutes);
app.use("/api/templates", uploadRoutes); // routes for fetching uploads
app.use("/api/projects", projectRoutes);  // CRUD in dashboard
app.use("/api", fileRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('edit', async (editData) => {
    await publisher.publish('documentEdits', JSON.stringify(editData));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


server.listen(port, () => {
  connectDB();
  console.log("Server started at http://localhost:" + port);
});

