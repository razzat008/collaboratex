import axios from 'axios';

export const compileLatex = async (projectId) => {
  // const directoryPath = `tmp/${projectId}`; // Adjust this path as needed

  try {
    const response = await axios.post('http://localhost:5000/api/generate-pdf', {
      projectId // Send the directory path
    }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // Include credentials if needed
    });

    return response.data; // Return the response data
  } catch (error) {
    console.error("Error compiling LaTeX:", error);
    // throw new Error('Failed to compile LaTeX'); // Throw an error for handling in the calling function
  }
};
