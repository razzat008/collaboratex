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
    const { projectId, fileName } = req.params; // Get projectId and fileName from the request parameters
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const directory = path.join(__dirname, '../tmp', projectId); // Construct the directory path
    const filePath = path.join(directory, fileName); // Construct the full file path
    // console.log(filePath)
    const content = await fs.readFile(filePath, 'utf-8'); // Read the file content
    // console.log(content);
    res.json({ content }); // Send the file content as a response

  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file content' }); // Handle errors
  }
};
