import express from 'express';
import authenticateToken from '../middlewares/auth_middleware.js';
import { fetchFiles } from '../_helpers/file_fetcher.js';

const router = express.Router();

router.get("/getfiles", authenticateToken, fetchFiles);

export default router;

