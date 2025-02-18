import axios from 'axios';

/**
 * Compiles the LaTeX content into a PDF.
 * @param {string} projectId - The ID of the project.
 * @param {string} latexContent - The LaTeX content to compile.
 * @returns {Promise} - A promise that resolves to the response from the server.
 */
export const compileLatex = async (projectId, latexContent) => {
  const directoryPath = `tmp/${projectId}`; // Adjust this path as needed

  try {
    const response = await axios.post('http://localhost:5000/api/generate-pdf', {
      latex: latexContent, // Send the current LaTeX content
      directory: directoryPath // Send the directory path
    }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // Include credentials if needed
    });

    return response.data; // Return the response data
  } catch (error) {
    console.error("Error compiling LaTeX:", error);
    throw new Error('Failed to compile LaTeX'); // Throw an error for handling in the calling function
  }
};
