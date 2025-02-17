import React, {useState} from "react";
import Editor from "../../components/Editor/Editor";
import FileSidebar from "../../components/FileSidebar/FileSidebar";
import SplitPane from "react-split-pane";
import './editorPage.css';
import { Home } from 'lucide-react'


export default function EditorPage() {
  const [currentFile, setCurrentFile] = useState("main.tex");
  const [files, setFiles] = useState([
    { name: "main.tex" },
    { name: "references.bib" },
    { name: "abstract.tex" }
  ]);

  return (
    <div className="editorPage h-screen bg-white-700">
      <div className="topBar text-white bg-gray-900 flex justify-center">
        <div className="flex mx-5 items-center">
          <Home className="" size={20} />
          <h6 className="px-1">Home</h6>
        </div>
        <button className="bg-green-700 rounded text-sm mr-10 p-1 px-2">Compile</button>

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
            pane2Style={{
              padding: "10px",
            }}
          >
            <Editor/>
            <div className="pdf-placeholder">
              <h1>PDF Renderer Placeholder</h1>
              {/* Integrate PDF rendering logic here */}
            </div>
          </SplitPane>
        </SplitPane>
      </div>
    </div>
  );
}