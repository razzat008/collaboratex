import React, { useState, useCallback } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript";

import { Controlled as ControlledEditor } from "react-codemirror2";

export default function Editor({ displayName }) {
  const [code, setCode] = useState(" ");

  const handleChange = useCallback(
    (editor, data, value) => {
      setCode(value);
    },
    [],
  );

  return (
    <div className="editor-container p-3 bg-gray-800 shadow-md">
      <div className="editor-title text-white mb-2">
        {displayName}
      </div>
      <ControlledEditor
        onBeforeChange={handleChange}
        value={code}
        onChange={(editor, data, value) => {
        }}
        className="code-mirror-wrapper"
        options={{
          lineWrapping: true,
          autoCursor: true,
          lint: true,
          mode: "javascript",
          theme: "material",
          lineNumbers: true,
        }}
      />
    </div>
  );
}