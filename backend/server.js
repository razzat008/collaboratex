import express from 'express'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import connectDB from './config/db.js'
import userRoutes from './routes/user_routes.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
// app.use(jwt)

app.use("/", userRoutes)


app.listen(port, () => {
  connectDB();
  console.log("Server started at http://localhost:" + port);
})
