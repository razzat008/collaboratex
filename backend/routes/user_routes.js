import express from 'express';
// import User from '../model/user.js'
import { signup, login, logout } from '../controllers/user_controller.js';
import authenticateToken from '../middlewares/auth_middleware.js';

const router = express.Router();


// router.get("/profile", authenticateToken, infoUser);
router.post("/logout", authenticateToken, logout);
router.post("/login", login);
router.post("/signup", signup);

export default router;
