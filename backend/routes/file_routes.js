import express from 'express';
import authenticateToken from '../middlewares/auth_middleware.js';
import { fetchFileContent, fetchFiles, saveLatexContent } from '../_helpers/file_fetcher.js';
import { pdf_gen } from '../_helpers/pdf_gen.js';

const router = express.Router();

router.get("/getfiles", authenticateToken, fetchFiles);
router.get("/getfilecontent/:projectId/:fileName", authenticateToken, fetchFileContent);
router.post("/savelatex", authenticateToken, saveLatexContent);
router.post("/generate-pdf", authenticateToken, pdf_gen);

export default router;
