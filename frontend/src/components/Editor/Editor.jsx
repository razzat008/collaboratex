import React, { useCallback } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/stex/stex";

import './editor.css';
import useSocket from "../../hooks/useSocket";

import { UnControlled as CodeMirror } from "react-codemirror2";

export default function Editor({ displayName }) {

  useSocket();

  return (
    <div className="editor h-full p-2 bg-gray-500">
      <CodeMirror
        className="code-mirror-wrapper h-full"
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
