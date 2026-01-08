import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { latex } from "codemirror-lang-latex";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/*
  Collaboration.tsx

  Yjs + y-websocket + y-codemirror.next based collaborative editor.

  Notes:
  - This component creates a Y.Doc, attaches a WebsocketProvider to the given
    websocket URL and room id, and mounts a CodeMirror editor wired to the Y.Text
    under the name "codemirror".
  - Awareness is used to broadcast/receive presence (cursor) information. We set
    local awareness state with a random color and a display name.
  - The server must run a Y-WebSocket server compatible with y-websocket (or
    another adapter that understands the Yjs websocket protocol).
*/

type Props = {
  // websocket url for y-websocket server (e.g. ws://localhost:1234)
  wsUrl?: string;
  // room/document id
  roomId?: string;
  // display name for this client (optional)
  name?: string;
  // container height (CSS unit)
  height?: string;
  // initial content (used only until Y syncs from provider)
  initialValue?: string;
};

const DEFAULT_WS = "ws://localhost:8080/ws";

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h} 70% 45%)`;
}

export default function Collaboration({
  wsUrl = DEFAULT_WS,
  roomId = "default-room",
  name,
  height = "100%",
  initialValue = "",
}: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    // Only mount once
    if (!parentRef.current) return;
    if (viewRef.current) return;

    // Create Y.Doc and provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // create provider that connects to wsUrl and roomId (path same as y-websocket examples)
    // The WebsocketProvider constructor signature: (url, roomName, doc, options?)
    // Log the exact URL we will attempt to connect to for debugging (y-websocket will connect to `${wsUrl}/${roomId}`)
    const fullUrl =
      (wsUrl.endsWith("/") ? wsUrl.slice(0, -1) : wsUrl) +
      "/" +
      encodeURIComponent(roomId);
    console.log(
      "Attempting Yjs websocket connection to:",
      fullUrl,
      "(wsUrl:",
      wsUrl,
      "roomId:",
      roomId,
      ")",
    );
    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
    providerRef.current = provider;

    // Awareness: set local state with user info (name, color, id)
    const awareness = provider.awareness;
    const clientId = Math.floor(Math.random() * 0xffff);
    const userName = name ?? `User-${clientId.toString(36)}`;
    const userColor = randomColor();

    awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      id: clientId,
    });

    // Y.Text that will be bound to CodeMirror
    const ytext = ydoc.getText("codemirror");

    // If initialValue is provided and the Y document is empty, populate it.
    // (This is a local bootstrap; the server's state will overwrite/merge on sync.)
    if (initialValue && ytext.length === 0) {
      ydoc.transact(() => {
        ytext.insert(0, initialValue);
      });
    }

    // Build CodeMirror editor state with yCollab + awareness
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        latex(),
        yCollab(ytext, awareness),
        EditorView.lineWrapping,
        // You can add additional customizations here (keymaps, themes, etc.)
      ],
    });

    const view = new EditorView({
      state,
      parent: parentRef.current,
    });

    viewRef.current = view;

    // Optional: log connection status
    provider.on("status", (event: { status: string }) => {
      // status is 'connected' or 'disconnected'
      console.log("y-websocket status:", event.status);
    });

    // Clean up on unmount
    return () => {
      try {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      } catch (e) {
        console.error("Error destroying EditorView:", e);
      }

      try {
        if (providerRef.current) {
          providerRef.current.disconnect();
          providerRef.current.destroy();
          providerRef.current = null;
        }
      } catch (e) {
        // provider.destroy may not exist in all versions; at least disconnect
      }

      try {
        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }
      } catch (e) {
        console.error("Error destroying Y.Doc:", e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, roomId]);

  return (

    <div ref={parentRef} className="h-[95%] overflow-auto">
		</div>
  );
}
