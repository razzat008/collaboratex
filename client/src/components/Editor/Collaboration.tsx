import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { latex } from "codemirror-lang-latex";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/*
  Collaboration.tsx

  Responsibilities / guarantees added:
  - Does NOT assume defaults for `wsUrl` or `roomId`. Both must be provided
    (validation will surface errors).
  - If `wsUrl` is a relative path (starts with '/'), it will be converted into
    a websocket URL using the current page origin (only when `window` exists).
    This is a convenience, not a default.
  - Provides a connection timeout: if we don't reach a 'connected' status within
    `CONNECTION_TIMEOUT_MS`, the component surfaces an error and disconnects.
  - Accepts `onError?: (msg: string) => void` so callers can display / log errors.
  - Cleans up Y.Doc, provider, and EditorView on unmount.
*/

type Props = {
  wsUrl?: string;
  roomId?: string;
  name?: string;
  height?: string;
  initialValue?: string;
  onError?: (msg: string) => void;
};

const CONNECTION_TIMEOUT_MS = 8000;

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h} 70% 45%)`;
}

export default function Collaboration({
  wsUrl,
  roomId,
  name,
  initialValue = "",
  onError,
}: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate inputs (do not assume any defaults)
    if (!roomId || roomId.trim() === "") {
      const msg =
        "Invalid roomId: a non-empty room identifier must be provided.";
      setError(msg);
      onError?.(msg);
      return;
    }
    if (!wsUrl || wsUrl.trim() === "") {
      const msg =
        "Invalid wsUrl: a websocket URL must be provided for realtime collaboration.";
      setError(msg);
      onError?.(msg);
      return;
    }

    if (!parentRef.current) {
      // Not mounted yet; wait for a real DOM node
      return;
    }
    if (viewRef.current) {
      // Already initialized
      return;
    }

    // Build a base websocket URL. If wsUrl is absolute (ws:// or wss://) use as-is.
    // If wsUrl is a relative path (starts with '/'), convert using current page origin.
    // Otherwise we treat it as invalid to avoid making implicit assumptions.
    let baseWs = wsUrl;
    const isAbsoluteWs = /^wss?:\/\//i.test(wsUrl);
    const isRelativePath = wsUrl.startsWith("/");

    if (!isAbsoluteWs && isRelativePath) {
      if (typeof window === "undefined") {
        const msg =
          "Relative websocket path provided but window is not available to resolve it.";
        setError(msg);
        onError?.(msg);
        return;
      }
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      baseWs = `${protocol}://${host}${port}${wsUrl}`;
    } else if (!isAbsoluteWs && !isRelativePath) {
      const msg = `Invalid websocket URL: '${wsUrl}'. Provide an absolute ws:// or wss:// URL or a path starting with '/'.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    // Remove trailing slashes for consistency
    baseWs = baseWs.replace(/\/+$/g, "");

    // Create Y.Doc
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create provider and attach
    let provider: WebsocketProvider;
    try {
      provider = new WebsocketProvider(baseWs, roomId, ydoc);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to create websocket provider: ${msg}`);
      onError?.(String(msg));
      return;
    }
    providerRef.current = provider;

    try {
      // Expose for quick debugging in DevTools (optional)
      if (typeof window !== "undefined") {
        (window as unknown as { __yProvider?: WebsocketProvider }).__yProvider =
          provider;
      }
    } catch {
      // ignore
    }

    // Awareness: set a local user presence
    const awareness = provider.awareness;
    const clientId = Math.floor(Math.random() * 0xffff);
    const userName = name ?? `User-${clientId.toString(36)}`;
    const userColor = randomColor();
    awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      id: clientId,
    });

    // Y.Text bound to CodeMirror
    const ytext = ydoc.getText("codemirror");
    if (initialValue && ytext.length === 0) {
      ydoc.transact(() => {
        ytext.insert(0, initialValue);
      });
    }

    // Create CodeMirror state and view
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        latex(),
        yCollab(ytext, awareness),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: parentRef.current,
    });

    viewRef.current = view;

    // Track connection status; if we don't connect within timeout, surface error
    let didConnect = false;

    const statusHandler = (event: { status: string }) => {
      if (event.status === "connected") {
        didConnect = true;
        setError(null);
      } else if (event.status === "disconnected") {
        // transient disconnect; do nothing
      }
      // log for debugging
      // console.log("y-websocket status:", event.status, "target:", baseWs, "room:", roomId);
    };

    provider.on("status", statusHandler);

    const timeout = setTimeout(() => {
      if (!didConnect) {
        const msg = `Realtime connection timeout: could not connect to ${baseWs} for room '${roomId}' within ${CONNECTION_TIMEOUT_MS}ms.`;
        setError(msg);
        onError?.(msg);
        try {
          provider.disconnect();
          // Destroy if available
          (provider as unknown as { destroy?: () => void }).destroy?.();
        } catch {
          // ignore errors during forced cleanup
        }
      }
    }, CONNECTION_TIMEOUT_MS);

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      try {
        provider.off?.("status", statusHandler);
      } catch {
        // ignore
      }

      try {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      } catch {
        // ignore
      }

      try {
        if (providerRef.current) {
          providerRef.current.disconnect();
          (
            providerRef.current as unknown as { destroy?: () => void }
          ).destroy?.();
          providerRef.current = null;
        }
      } catch {
        // ignore
      }

      try {
        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }
      } catch {
        // ignore
      }
    };
    // Dependencies: we only want to re-run when wsUrl or roomId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, roomId]);

  // Render error state to inform user and prevent the editor from silently trying to connect.
  if (error) {
    return (
      <div className="h-[95%] overflow-auto" style={{ height: "100%" }}>
        <div className="p-4 text-red-600 break-words">
          Realtime error: {error}
        </div>
      </div>
    );
  }

  // Optionally show a small indicator that we're connected or connecting.
  return (
    <div ref={parentRef} className="h-[95%] overflow-auto">
      {/* The editor is mounted into this container. We don't render extra UI here
          to keep the component focused; parent wrappers can inspect `connected`
          or get errors via `onError` to display custom indicators. */}
    </div>
  );
}
