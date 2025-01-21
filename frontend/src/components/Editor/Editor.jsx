import React, { useCallback } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/stex/stex";

import './editor.css';

import { UnControlled as CodeMirror } from "react-codemirror2";

export default function Editor({ displayName }) {

  return (
    <div className="editor p-3 bg-gray-800">
      <div className="editor-title text-white mb-2">
        {displayName}
      </div>
      <CodeMirror
        className="code-mirror-wrapper"
        autoCursor={true}
        autoScroll={true}
        options={{
          lineWrapping: true,
          lint: false,
          mode: "stex",
          theme: "default",
          lineNumbers: true,
          smartIndent: true,
          spellcheck: true,
        }}
      />
    </div>
  );
}