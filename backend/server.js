import express from 'express';
import dotenv from 'dotenv';
// import jwt from 'jsonwebtoken';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/user_routes.js';
import cookieParser from 'cookie-parser';
import authenticateToken from './middlewares/auth_middleware.js';


dotenv.config()

const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
// app.use(authenticateToken); //authMiddleware

app.use("/", userRoutes)


app.listen(port, () => {
  connectDB();
  console.log("Server started at http://localhost:" + port);
})
