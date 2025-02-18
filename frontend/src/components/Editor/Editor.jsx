import React, { useCallback, useEffect, useState } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/stex/stex";
import "./editor.css";
import useSocket from "../../hooks/useSocket";
import { UnControlled as CodeMirror } from "react-codemirror2";

export default function Editor({ displayName, roomId }) {
  const [editorRef, setEditorRef] = useState(null);
  const { joinRoom, sendCursorPosition, onCursorPosition } = useSocket();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId, joinRoom]);

  const handleCursorChange = useCallback(
    (editor) => {
      const cursor = editor.getCursor();
      const cursorPosition = { line: cursor.line, ch: cursor.ch };
      sendCursorPosition(roomId, cursorPosition);
    },
    [roomId, sendCursorPosition]
  );

  useEffect(() => {
    onCursorPosition((data) => {
      console.log("Other user's cursor position:", data);
    });
  }, [onCursorPosition]);

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
        editorDidMount={(editor) => {
          setEditorRef(editor);
          editor.on("cursorActivity", () => handleCursorChange(editor));
        }}
      />
    </div>
  );
}

