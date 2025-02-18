import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import './editorPage.css';
import { Home } from 'lucide-react';
import PDFViewer from "../../components/PDFViewer/PDFViewer";
import { fetchFilesInDirectory } from '../../api/fileHelper'; // Adjust the import path
import { fetchFileContent } from '../../api/fileHelper'; // Import the function to fetch file content
import { compileLatex } from '../../api/compile'; // Import the function to fetch file content

export default function EditorPage() {
  const { projectId } = useParams(); // Get the project ID from the URL
  const navigate = useNavigate();
  const gotoHome = () => {
    navigate("/dashboard");
  };

  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState(""); // State to hold the content of the current file

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const directoryPath = `tmp/${projectId}`; // Adjust this path as needed
        const filesList = await fetchFilesInDirectory(directoryPath); // Call the API with the directory path
        setFiles(filesList.map(file => ({ name: file }))); // Map to the expected format
      } catch (error) {
        console.error("Failed to load files:", error);
        setFiles([]); // Set files to an empty array in case of error
      }
    };

    loadFiles();
  }, [projectId]); // Add projectId as a dependency

  useEffect(() => {
    const loadFileContent = async () => {
      if (currentFile) {
        try {
          console.log("Fetching content for:", currentFile); // Log the current file being fetched
          const content = await fetchFileContent(projectId, currentFile); // Fetch the content of the selected file
          setFileContent(content); // Set the content in state
        } catch (error) {
          console.error("Failed to load file content:", error);
          setFileContent(""); // Reset content in case of error
        }
      }
    };

    loadFileContent();
  }, [currentFile, projectId]); // Fetch content whenever currentFile changes
  // const handleCompile = async () => {
  //
  //   try {
  //
  //     const result = await compileLatex(projectId); // Call the compile function
  //
  //     console.log("PDF generated successfully:", result);
  //
  //     // You can handle the result here, e.g., show a success message or open the PDF
  //
  //   } catch (error) {
  //
  //     console.error("Compilation failed:", error);
  //
  //     // Handle the error (e.g., show an error message to the user)
  //
  //   }
  //
  // };

  return (
    <div className="editorPage h-screen bg-white-700">
      <div className="topBar text-white bg-gray-900 flex justify-center">
        <button className="flex mx-5 items-center" onClick={gotoHome}>
          <Home className="" size={20} />
          <h6 className="px-1">Home</h6>
        </button>
        <button className="bg-green-700 rounded text-sm p-1 px-2">Compile</button>
      </div>

      <div className="paneContainer">
        <SplitPane
          className="h-full"
          split="vertical"
          defaultSize={"13.5%"}
          pane1Style={{}}
          pane2Style={{}}
          paneStyle={{
            margin: 0,
            display: "flex",
          }}
          allowResize={false}
        >
          <FileSidebar files={files} setCurrentFile={setCurrentFile} />
          <SplitPane
            className="h-full"
            split="vertical"
            defaultSize={"58%"}
            minSize={500}
            pane1Style={{}}
            pane2Style={{}}
            step={5}
          >
            <Editor value={fileContent} /> {/* Pass the file content to the Editor */}
            <PDFViewer filePath="/sample1.pdf" />
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}
