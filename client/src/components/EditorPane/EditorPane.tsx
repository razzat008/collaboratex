import React from "react";
// If you use react-codemirror2 (v7), import as below. Otherwise, adjust for your CodeMirror React wrapper.
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";

import { EditorView } from "@codemirror/view";

const EditorPane: React.FC = () => {
  const [value, setValue] = React.useState("% Start typing your LaTeX here");

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <CodeMirror
        value={value}
        height="100%"
        theme="light"
        extensions={[
          latex(),
          EditorView.lineWrapping,
          EditorView.theme({
            ".cm-content": {
              fontSize: "16px",
              fontWeight: "bold",
            },
          }),
        ]}
        onChange={setValue}
        basicSetup={{
          lineNumbers: true,
          autocompletion: true,
        }}
      />
    </div>
  );
};

export default EditorPane;
