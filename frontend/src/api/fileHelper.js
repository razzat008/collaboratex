import axios from 'axios';

export const fetchFilesInDirectory = async (directoryPath) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/getfiles?directory=${encodeURIComponent(directoryPath)}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    // console.log("API Response:", response.data); // Log the response data
    return response.data.files || []; // Return an empty array if 'files' is missing
  } catch (error) {
    console.error("Error fetching files:", error);
    // You can also handle specific error types here and give custom messages
    throw error; // Rethrow the error for handling in the calling function
  }
};


export const fetchFileContent = async (projectId, fileName) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/getfilecontent/${projectId}/${fileName}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // Include credentials if needed
    });

    // Return the content from the response
    return response.data.content; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw new Error('Failed to fetch file content'); // Rethrow the error for handling in the calling function
  }
};
