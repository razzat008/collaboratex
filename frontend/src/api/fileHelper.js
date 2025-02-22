import axios from 'axios';

export const fetchFilesInDirectory = async (directoryPath) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/getfiles?directory=${encodeURIComponent(directoryPath)}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data.files || []; 
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error; 
  }
};

export const fetchFileContent = async (projectId, fileName) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/getfilecontent/${projectId}/${fileName}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, 
    });
    return response.data.content; 
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw new Error('Failed to fetch file content'); 
  }
};

export const saveLatexContent = async (projectId, fileName, latexContent) => {

  try {

    const response = await axios.post(`http://localhost:5000/api/savelatex`, {
      projectId,
      fileName, 
      content: latexContent,
    }, {
      withCredentials: true,
    });


    return response.data; 

  } catch (error) {

    console.error("Error saving LaTeX content:", error);

    throw new Error('Failed to save LaTeX content'); 

  }

};
