import express from 'express';
// import User from '../model/user.js'
import { createUser, authenticateUser } from '../controllers/user_controller.js';

const router = express.Router();

// router.post("/",authenticateUser);

router.post("/signup", createUser);
router.post("/login", authenticateUser);
// router.get("/profile", infoUser);

export default router;
