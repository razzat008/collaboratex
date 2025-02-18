import express from 'express';
import authenticateToken from '../middlewares/auth_middleware.js';
import { fetchFileContent, fetchFiles } from '../_helpers/file_fetcher.js';
import {pdf_gen} from '../_helpers/pdf_gen.js';

const router = express.Router();

router.get("/getfiles", authenticateToken, fetchFiles);
router.post("/generate-pdf", authenticateToken, pdf_gen);
router.get("/getfilecontent/:projectId/:fileName", authenticateToken, fetchFileContent);

export default router;
