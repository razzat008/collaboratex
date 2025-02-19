import React, { useEffect, useState, useRef, useCallback } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/stex/stex";

import "./editor.css";
import useSocket from "../../hooks/useSocket";
import { UnControlled as CodeMirror } from "react-codemirror2";

export default function Editor({ displayName, roomId, value }) {
  const [cursors, setCursors] = useState({}); // Store other users' cursors
  const editorRef = useRef(null); // Store editor instance
  const { socket, sendCursorPosition } = useSocket(roomId);
  const userId = socket?.id || displayName;

  // Handle incoming cursor updates
  useEffect(() => {
    if (!socket) return;

    const handleCursorUpdate = ({ userId, cursorPosition }) => {
      setCursors((prev) => ({
        ...prev,
        [userId]: cursorPosition,
      }));
    };

    socket.on("cursor-position", handleCursorUpdate);
    return () => socket.off("cursor-position", handleCursorUpdate);
  }, [socket]);

  // Handle file update
  useEffect(() => {
    if (!socket) return;

    const handleFileUpdate = (updatedContent) => {
      if (editorRef.current?.getValue() !== updatedContent) {
        editorRef.current?.setValue(updatedContent);
      }
    };

    socket.on("file:update", handleFileUpdate);
    return () => socket.off("file:update", handleFileUpdate);
  }, [socket]);

  // Handle editor changes
  const handleEditorChange = (editor, data, value) => {
    if (socket) {
      socket.emit("file:edit", { fileId: roomId, content: value });
    }
  };

  // Handle cursor activity
  const handleCursorActivity = useCallback(
    (editor) => {
      if (!editor || !socket) return;

      const cursor = editor.getCursor();
      const newCursorPos = { line: cursor.line, ch: cursor.ch };

      // Prevent redundant updates
      if (cursors[userId] && cursors[userId].line === newCursorPos.line && cursors[userId].ch === newCursorPos.ch) {
        return;
      }

      sendCursorPosition({ userId, cursorPosition: newCursorPos });

      setCursors((prev) => ({
        ...prev,
        [userId]: newCursorPos,
      }));
    },
    [sendCursorPosition, cursors, userId, socket]
  );

  // Handle user disconnection
  useEffect(() => {
    if (!socket) return;

    socket.on("user-disconnected", (userId) => {
      setCursors((prev) => {
        const updatedCursors = { ...prev };
        delete updatedCursors[userId];
        return updatedCursors;
      });
    });

    return () => socket.off("user-disconnected");
  }, [socket]);

  return (
    <div className="editor h-full p-2 bg-gray-500 relative">
      <CodeMirror
        className="code-mirror-wrapper h-full"
        autoCursor={true}
        autoScroll={true}
        value={value} // Set the value prop to the CodeMirror component
        options={{
          lineWrapping: true,
          lint: false,
          mode: "stex",
          theme: "material",
          lineNumbers: true,
          smartIndent: true,
          spellcheck: true,
        }}
        editorDidMount={(editor) => (editorRef.current = editor)} // Store editor instance
        onCursorActivity={handleCursorActivity}
        onChange={handleEditorChange} // Handle editor content change
      />

      {/* Render real-time cursor indicators */}
      {Object.entries(cursors).map(([id, pos]) => (
        <CursorIndicator key={id} cursorPosition={pos} editor={editorRef.current} />
      ))}
    </div>
  );
}

// Cursor Indicator Component
const CursorIndicator = ({ cursorPosition, editor }) => {
  if (!cursorPosition || !editor) return null;

  const coords = editor.charCoords(cursorPosition, "window");

  return (
    <div
      className="cursor-indicator"
      style={{
        position: "absolute",
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        backgroundColor: "red",
        width: "2px",
        height: "15px",
        zIndex: 10,
      }}
    />
  );
};

