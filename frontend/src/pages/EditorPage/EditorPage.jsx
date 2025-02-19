import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Added authentication context
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import "./editorPage.css";
import { Home } from "lucide-react";
import PDFViewer from "../../components/PDFViewer/PDFViewer";
import { fetchFilesInDirectory, fetchFileContent } from "../../api/fileHelper";
import { compileLatex } from "../../api/compile";

export default function EditorPage() {
  const { projectId } = useParams();
  const { username } = useAuth(); // Get username from AuthContext
  const navigate = useNavigate();
  
  const gotoHome = () => {
    navigate("/dashboard");
  };

  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const loadFiles = async () => {
      try {
        const directoryPath = `tmp/${projectId}`;
        const filesList = await fetchFilesInDirectory(directoryPath);
        setFiles(filesList.map(file => ({ name: file })));
      } catch (error) {
        console.error("Failed to load files:", error);
        setFiles([]);
      }
    };

    loadFiles();
  }, [projectId]);

  useEffect(() => {
    const loadFileContent = async () => {
      if (!currentFile) return;
      
      try {
        console.log("Fetching content for:", currentFile);
        const content = await fetchFileContent(projectId, currentFile);
        setFileContent(content);
      } catch (error) {
        console.error("Failed to load file content:", error);
        setFileContent("");
      }
    };

    loadFileContent();
  }, [currentFile, projectId]);

  const handleCompile = async () => {
    try {
      const result = await compileLatex(projectId);
      if (!result) {
        console.error("PDF generation failed.");
      }
      console.log("PDF generated successfully:", result);
    } catch (error) {
      console.error("Compilation failed:", error);
    }
  };

  return (
    <div className="editorPage h-screen bg-white-700">
      <div className="topBar text-white bg-gray-900 flex justify-center">
        <button className="flex mx-5 items-center" onClick={gotoHome}>
          <Home size={20} />
          <h6 className="px-1">Home</h6>
        </button>
        <button className="bg-green-700 rounded text-sm p-1 px-2" onClick={handleCompile}>
          Compile
        </button>
      </div>

      <div className="paneContainer">
        <SplitPane className="h-full" split="vertical" defaultSize={"13.5%"} allowResize={false}>
          <FileSidebar files={files} setCurrentFile={setCurrentFile} />
          <SplitPane className="h-full" split="vertical" defaultSize={"58%"} minSize={500} step={5}>
            <Editor 
              displayName={username || "User X"} 
              roomId={projectId} 
              fileId={currentFile} 
              value={fileContent} 
            />
            <PDFViewer filePath="/main.pdf" />
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}

