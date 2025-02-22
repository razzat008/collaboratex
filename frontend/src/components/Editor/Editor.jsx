import React from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/stex/stex";
import "./editor.css";
import useSocket from "../../hooks/useSocket";
import { Controlled as CodeMirror } from "react-codemirror2"; 
import { useEffect } from "react";

export default function Editor({ value, onChange, onSave }) {
  useSocket();
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        console.log("Ctrl + S pressed");
        onChange(value); 
        if (onSave) {
          onSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [value, onChange, onSave]);

  return (
    <div className="editor h-[850px] h-full p-2 bg-gray-500">
      <CodeMirror
        className="code-mirror-wrapper h-full"
        value={value} 
        options={{
          lineWrapping: true,
          lint: false,
          mode: "stex",
          theme: "default",
          lineNumbers: true,
          smartIndent: true,
          spellcheck: true,
        }}
        onBeforeChange={(editor, data, newValue) => {
          onChange(newValue); 
        }}
      />
    </div>
  );
}
