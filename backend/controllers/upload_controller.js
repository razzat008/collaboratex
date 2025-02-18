import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; // Use promises for async operations
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url'; // Import fileURLToPath
import { dirname } from 'path'; // Import dirname
import Project from '../model/project.js';

const router = express.Router();

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure tmp directory exists
const tmpDir = path.join(__dirname, '../tmp');

const ensureTmpDirExists = async () => {
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (error) {
    console.error('Error creating tmp directory:', error);
  }
};

ensureTmpDirExists();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  },
});

// API endpoint to handle ZIP file upload and project creation
router.post('/', upload.single('file'), async (req, res) => {
  const { projectName, userName } = req.body; // Get project name and user name from the request body

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Create a new project entry in the database
    const newProject = new Project({
      userName,
      projectName,
      createdAt: Date.now(),
    });

    const savedProject = await newProject.save(); // Save the project to the database
    const projectId = savedProject._id; // Get the generated project ID

    // Create a directory for the project using the project ID
    const projectDir = path.join(tmpDir, projectId.toString());
    await fs.mkdir(projectDir, { recursive: true });

    // Extract ZIP file to the project directory
    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(projectDir, true);

    // Delete the uploaded ZIP file after extraction
    await fs.unlink(zipPath);

    res.json({ message: 'File uploaded and extracted', path: projectDir });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

export default router;
