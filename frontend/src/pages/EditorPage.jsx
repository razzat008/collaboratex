import React from "react";
import Editor from "../components/Editor/Editor";

export default function EditorPage() {
  return (
    <div className="editor-page p-8 bg-white-700">
      <Editor displayName="Code Editor" />
    </div>
  );
}