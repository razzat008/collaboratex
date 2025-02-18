import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import './editorPage.css';
import { Home } from 'lucide-react';
import PDFViewer from "../../components/PDFViewer/PDFViewer";
import { fetchFilesInDirectory } from '../../api/fileHelper'; // Adjust the import path

export default function EditorPage() {
  const { projectId } = useParams(); // Get the project ID from the URL
  const navigate = useNavigate();
  const gotoHome = () => {
    navigate("/dashboard");
  };

  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Construct the directory path on the backend
        const directoryPath = `tmp/${projectId}`; // Adjust this path as needed
        const filesList = await fetchFilesInDirectory(directoryPath); // Call the API with the directory path
        // console.log("Files List:", filesList); // Log the files list
        setFiles(filesList.map(file => ({ name: file }))); // Map to the expected format
      } catch (error) {
        console.error("Failed to load files:", error);
        setFiles([]); // Set files to an empty array in case of error
      }
    };

    loadFiles();
  }, [projectId]); // Add projectId as a dependency

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
            <Editor />
            <PDFViewer filePath="/sample1.pdf" />
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}
