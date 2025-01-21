import React, { useState } from "react";
import Editor from "../components/Editor/Editor";

export default function EditorPage() {
  const [code, setCode] = useState("");

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  return (
    <div className="editor-page p-8 bg-white-700">
      <Editor
        displayName="Code Editor"
        value={code}
        onChange={handleCodeChange}
        language="javascript"
      />
    </div>
  );
}
