import React, { useState, useCallback } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/xml/xml";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/css/css";
import { Controlled as ControlledEditor } from "react-codemirror2";

export default function Editor(props) {
  const { displayName, value, onChange, language } = props;

  const handleChange = useCallback(
    (editor, data, value) => {
      onChange(value);
    },
    [onChange],
  );

  return (
    <div className="editor-container p-3 bg-gray-800 shadow-md">
      <div className="editor-title text-white mb-2">
        {displayName}
      </div>
      <ControlledEditor
        onBeforeChange={handleChange}
        value={value}
        className="code-mirror-wrapper"
        options={{
          lineWrapping: true,
          lint: true,
          mode: language,
          theme: "material",
          lineNumbers: true,
        }}
      />
    </div>
  );
}
