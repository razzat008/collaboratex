import fs from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import util from "util";

const execPromise = util.promisify(exec);

export const pdf_gen = async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: "Project ID is required" });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tmpDir = path.join(__dirname, "../tmp/", projectId );
  const texFilePath = path.join(tmpDir, "main.tex");
  const outputDir = tmpDir; 
  const generatedPdfPath = path.join(outputDir, "main.pdf"); 
  const publicPdfPath = path.join(__dirname, "../../frontend/public/main.pdf"); 

  try {
    await execPromise(`latexmk -pdf -f ${texFilePath} -output-directory=${outputDir} `);
    await fs.rename(generatedPdfPath, publicPdfPath);

    console.log("PDF successfully generated and moved to public directory.");
    return res.status(200).json({ message: "PDF generated successfully." });

  } catch (error) {
    console.error("Error generating PDF:", error.stderr || error);
    return res.status(500).json({ error: "PDF generation failed", details: error.stderr || error.message });
  }
};
