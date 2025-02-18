import fs from 'fs/promises';
import path from 'path';

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
    console.error("this ialksfj");
    res.status(500).json({ error: 'Failed to read directory', files: [] }); // Always include a 'files' array

  }
}
