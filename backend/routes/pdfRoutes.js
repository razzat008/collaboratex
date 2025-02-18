// routes/pdfRoutes.js
import express from "express";
import fs from "fs/promises";
import { exec } from "child_process";
import path from "path";

const router = express.Router();

router.post("/generate-pdf", async (req, res) => {
  const { projectId, latex } = req.body; // Receive both projectId and latex content
  if (!projectId || !latex) return res.status(400).json({ error: "Project ID and LaTeX content are required" });

  const directory = path.join(__dirname, '../tmp', projectId);
  const texFilePath = path.join(directory, "document.tex");
  const pdfPath = path.join(__dirname, '../../frontend/public/', "main.pdf"); // Save PDF in the public directory

  try {
    // Write the LaTeX content to a .tex file
    await fs.writeFile(texFilePath, latex);

    // Run latexmk to compile the LaTeX file
    exec(`latexmk -pdf -output-directory=${directory} ${texFilePath}`, (err, stdout, stderr) => {
      if (err) {
        console.error("PDF generation error:", stderr);
        return res.status(500).json({ error: "PDF generation failed", details: stderr });
      }

      // Move the generated PDF to the public directory
      fs.rename(path.join(directory, "document.pdf"), pdfPath)
        .then(() => {
          console.log("PDF saved successfully to public directory.");
          res.status(200).json({ message: "PDF generated and saved successfully." });
        })
        .catch((renameError) => {
          console.error("Error moving PDF to public directory:", renameError);
          return res.status(500).json({ error: "Failed to move PDF to public directory" });
        });
    });
  } catch (error) {
    console.error("Error writing .tex file:", error);
    return res.status(500).json({ error: "Failed to write .tex file" });
  }
});

export default router;
