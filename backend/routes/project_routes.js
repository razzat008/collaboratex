import express from "express";
import Project from "../model/project.js";
import authenticateToken from "../middlewares/auth_middleware.js"; // Assuming JWT authentication
import { createProject, findProject } from "../controllers/project_controller.js";


const router = express.Router();

router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, findProject);

export default router;
