import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises'; // Use promises for async operations
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url'; // Import fileURLToPath
import { dirname } from 'path'; // Import dirname

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

// API endpoint to handle ZIP file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const zipPath = req.file.path;
    const extractPath = path.join(tmpDir, path.basename(zipPath, '.zip'));

    // Extract ZIP file
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Delete the uploaded ZIP file after extraction
    await fs.unlink(zipPath);

    res.json({ message: 'File uploaded and extracted', path: extractPath });
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    res.status(500).json({ error: 'Failed to extract ZIP' });
  }
});

export default router;
