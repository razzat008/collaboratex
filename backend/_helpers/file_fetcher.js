import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const fetchFiles = async (req, res) => {
  try {
    const { directory } = req.query; // Get the directory path from the query parameters
    if (!directory) {
      return res.status(400).json({ error: 'Directory path is required' });
    }
    const files = await fs.readdir(directory); // Read the directory
    res.json({ files }); // Send the list of files as a response

  } catch (error) {

    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to read directory', files: [] }); // Always include a 'files' array

  }
}

export const fetchFileContent = async (req, res) => {

  try {
    const { projectId, fileName } = req.params; 
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const directory = path.join(__dirname, '../tmp', projectId); 
    const filePath = path.join(directory, fileName); 
    // console.log(filePath)
    const content = await fs.readFile(filePath, 'utf-8'); 
    // console.log(content);
    res.json({ content }); 

  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file content' }); // Handle errors
  }
};

export const saveLatexContent = async (req, res) => {
  try {
    const { projectId, fileName, content } = req.body;
    if (!projectId || !fileName || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, "..", "tmp", projectId, fileName);

    fs.writeFile(filePath, content, "utf8");
    res.json({ message: "File saved successfully" });
  } catch (error) {
    console.error("Error saving file:", error);
    res.status(500).json({ error: "Internal server error" });
  }

};
