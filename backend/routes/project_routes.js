import express from "express";
import Project from "../model/project.js";
import authenticateToken from "../middlewares/auth_middleware.js"; // Assuming JWT authentication
import { createProject, deleteProject, findProject, updateProject } from "../controllers/project_controller.js";


const router = express.Router();

router.post("/createProject", authenticateToken, createProject);
router.get("/findProject", authenticateToken, findProject);
router.delete("/deleteProject", authenticateToken, deleteProject);
router.put("/update", authenticateToken, updateProject);

export default router;
