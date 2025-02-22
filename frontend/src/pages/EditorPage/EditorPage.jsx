import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import './editorPage.css';
import { Home, Save } from 'lucide-react';
import PDFViewer from "../../components/PDFViewer/PDFViewer";
import { fetchFilesInDirectory, fetchFileContent, saveLatexContent } from '../../api/fileHelper';
import { compileLatex } from '../../api/compile';

export default function EditorPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const gotoHome = () => {
    navigate("/dashboard");
  };

  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [pdfpath, setpdfpath] = useState("");

  useEffect(() => {
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

  // document.addEventListener()


  useEffect(() => {
    const loadFileContent = async () => {
      if (currentFile) {
        try {
          console.log("Fetching content for:", currentFile);
          const content = await fetchFileContent(projectId, currentFile);
          // console.log("Loaded content:", content); // Debugging
          setFileContent(content);
        } catch (error) {
          console.error("Failed to load file content:", error);
          setFileContent("");
        }
      }
    };

    loadFileContent();
  }, [currentFile, projectId]);

  useEffect(() => {
    const storedPdfPath = localStorage.getItem('pdfPath');
    if (storedPdfPath) {
      setpdfpath(storedPdfPath); // Set the PDF path from local storage
    }
  }, []);

  const handleCompile = async () => {
    try {
      const result = await compileLatex(projectId);
      console.log("PDF generated successfully:", result.message);
      const timestamp = new Date().getTime();
      setpdfpath(`http://localhost:5173/main.pdf?t=${timestamp}`);
    } catch (error) {
      console.error("Compilation failed:", error);
    }
  };

  const handleSave = async () => {
    try {
      console.log("Saving content:", fileContent); // Debugging
      const result = await saveLatexContent(projectId, currentFile, fileContent);
      console.log("Save successful:", result.message);
    } catch (error) {
      console.error("Error saving LaTeX content:", error);
      // alert("Error saving LaTeX content: " + (error.message || "An unknown error occurred."));
    }
  };

  return (
    <div className="editorPage h-screen bg-white-700">
      <div className="topBar text-white bg-gray-900 flex justify-center">
        <button className="flex mx-5 items-center" onClick={gotoHome}>
          <Home className="" size={20} />
          <h6 className="px-1">Home</h6>
        </button>
        <button className="bg-green-700 rounded text-sm p-1 px-2" onClick={handleCompile}>Compile</button>

        <button className="bg-blue-700 rounded text-sm p-1 px-2 mx-2 flex items-center" onClick={handleSave}>
          <Save size={16} className="mr-1" />
          Save
        </button>
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
            <Editor value={fileContent} onChange={setFileContent} onSave={handleSave} onCompile={handleCompile} />
            <PDFViewer filePath={pdfpath} />
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}

