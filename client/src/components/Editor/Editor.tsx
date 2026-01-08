import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { highlightActiveLine, EditorView } from "@codemirror/view";
import Collaboration from "./Collaboration";

interface EditorProps {
  // When true (default) use the Yjs-based collaborative editor.
  collab?: boolean;
  // Room/document id for the Yjs websocket provider (only used when collab === true).
  roomId?: string;
  // WebSocket server url for the y-websocket server (only used when collab === true).
  wsUrl?: string;
  // Display name used for awareness (only used when collab === true).
  name?: string;
  // Initial content applied to the Y.Doc before sync (optional).
  initialValue?: string;
  // Fallback non-collab initial content (used when collab === false).
  value?: string;
  // Container height (CSS unit)
  height?: string;
  // Optional onChange for non-collab editor
  onChange?: (value: string) => void;
}

/**
 * Editor
 *
 * Defaults to Yjs (y-codemirror.next + y-websocket) collaborative editor.
 * Pass `collab={false}` to use a local CodeMirror instance instead.
 */
export default function Editor({
  collab = true,
  roomId = "default-room",
  wsUrl,
  name,
  initialValue = "",
  value = "",
  height = "100%",
  onChange,
}: EditorProps) {
  // Keep cursor visible when document changes (useful for non-collab editor)
  const keepCursorVisible = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          update.view.scrollIntoView(update.state.selection.main.head, {
            y: "nearest",
          });
        }
      }),
    [],
  );

  // Reduce scrollPastEnd extra padding
  const customScrollPad = useMemo(
    () =>
      EditorView.theme({
        ".cm-scroller": {
          paddingBottom: "45rem", // smaller scroll area after last line
        },
      }),
    [],
  );

  const localExtensions = useMemo(
    () => [
      latex(),
      keepCursorVisible,
      highlightActiveLine(),
      EditorView.lineWrapping,
      customScrollPad,
      EditorView.theme({
        ".cm-scroller": { overflow: "auto" },
      }),
    ],
    [keepCursorVisible, customScrollPad],
  );

  if (collab) {
    // Render Yjs-based collaboration editor
    return (
      <div className="h-[95%] overflow-auto" style={{ height }}>
        <Collaboration
          wsUrl={wsUrl}
          roomId={roomId}
          name={name}
          initialValue={initialValue}
          height={height}
        />
      </div>
    );
  }

  // Render local (non-collaborative) CodeMirror editor
  return (
    <div className="h-[95%] overflow-auto" style={{ height }}>
      <CodeMirror
        value={value}
        height={height}
        theme="light"
        extensions={localExtensions}
        basicSetup={{
          lineNumbers: true,
          autocompletion: true,
        }}
        onChange={(val) => {
          onChange?.(val);
        }}
      />
    </div>
  );
}
