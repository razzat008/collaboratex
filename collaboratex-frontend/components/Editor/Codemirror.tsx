import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { yCollab } from "y-codemirror.next";
import { latex } from "codemirror-lang-latex";

/* ------------------ utils ------------------ */

function randomName(): string {
  return "User-" + Math.floor(Math.random() * 10000);
}

function randomColor(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

/* ------------------ editor ------------------ */

export default function CMEditor() {
  const { id: projectId } = useParams<{ id: string }>();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const username = useMemo(() => randomName(), []);
  const userColor = useMemo(() => randomColor(), []);

  useEffect(() => {
    if (!editorRef.current || !projectId) return;

    /* 1️⃣ Create Yjs document */
    const ydoc = new Y.Doc();

    /* 2️⃣ WebSocket provider (dumb relay server) */
    const provider = new WebsocketProvider(
      "ws://localhost:8080/ws",
      projectId, // 👈 room name
      ydoc
    );

    /* 3️⃣ Shared text type */
    const yText = ydoc.getText("codemirror");

    /* 4️⃣ Awareness (cursor + username) */
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: userColor,
    });

    /* 5️⃣ CodeMirror state */
    const state = EditorState.create({
      extensions: [
        basicSetup,
				latex(),
        yCollab(yText, provider.awareness),
				EditorView.lineWrapping,
      ],
    });

    /* 6️⃣ Editor view */
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    /* 7️⃣ Cleanup */
    return () => {
      view.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [projectId, username, userColor]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div ref={editorRef} style={{ height: "100%" }} />
    </div>
  );
}
