import React from "react";
import Editor from "../components/Editor/Editor";
import SplitPane from "react-split-pane";
import './editorPage.css';

export default function EditorPage() {
  return (
    <div className="editorPage h-full bg-white-700">
      <SplitPane
        className="h-full"
        style={{ height: "83%" }}
        split="vertical"
        defaultSize={"55%"}
        minSize={55}
        pane1Style={{
          marginRight: 5,
          paddingRight: 0,
          paddingLeft: 13,
          paddingTop: 13,
          paddingBottom: 13
        }}
        pane2Style={{
          "margin-left": 5,
          padding: 10
        }}
        paneStyle={{ margin: 0 }}
        allowResize={true}
        step={5}
      >
        <Editor displayName="Code Editor" />
        <div><h1>pdf renderer placeholder</h1></div>
      </SplitPane>
    </div>
  );
}