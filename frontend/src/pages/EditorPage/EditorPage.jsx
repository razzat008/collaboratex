import React, {useState} from "react";
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import './editorPage.css';
import { Home } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import PDFViewer from "../../components/PDFViewer/PDFViewer";


export default function EditorPage() {
  const navigate = useNavigate();
  const gotoHome = () => {
    navigate("/dashboard");
  };

  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([
    { name: "main.tex" },
    { name: "references.bib" },
    { name: "abstract.tex" }
  ]);

  return (
    <div className="editorPage h-screen bg-white-700">
      <div className="topBar text-white bg-gray-900 flex justify-center">
        <button className="flex mx-5 items-center" onClick={gotoHome} >
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
          step={5}
        >
          <FileSidebar files={files} setCurrentFile={setCurrentFile} />
          <SplitPane
            className="h-full"
            split="vertical"
            defaultSize={"58%"}
            minSize={500}
            // maxSize={1050}
            pane1Style={{}}
            pane2Style={{}}
          >
            <Editor/>
            <div className="pdf-placeholder">
              <PDFViewer filePath="/sample1.pdf" />
            </div>
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}