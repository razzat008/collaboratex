import { useEffect, useState } from "react";
import Collaboration from "./Collaboration";

/*
  Editor.tsx

  - Requires an explicit `roomId` and `wsUrl`. No implicit/default room.
  - Verifies the document exists by calling GET /api/documents/:roomId
    - 200 -> mount the Collaboration editor with the returned content (if any)
    - 404 -> surface "Document not found" error and DO NOT mount Collaboration
    - other non-2xx -> surface an error with status text
  - Surfaces loading and error UI so the user knows why the editor did not mount.
  - Does not assume any defaults for websocket or room identifiers.
*/

export interface EditorProps {
  // Must be provided by the caller (no default).
  roomId?: string;
  // Must be provided by the caller (no default).
  wsUrl?: string;
  name?: string;
  initialValue?: string;
  height?: string; // CSS height value
}

export default function Editor({
  roomId,
  wsUrl,
  name,
  initialValue = "",
  height = "100%",
}: EditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverContent, setServerContent] = useState<string | null>(null);

  useEffect(() => {
    // Reset states whenever inputs change
    setError(null);
    setServerContent(null);

    // Validate presence of required inputs
    if (!roomId || roomId.trim() === "") {
      setError(
        "Missing document/room identifier. Please provide a valid `roomId`.",
      );
      return;
    }
    if (!wsUrl || wsUrl.trim() === "") {
      setError(
        "Missing WebSocket URL. Please provide a valid `wsUrl` for realtime collaboration.",
      );
      return;
    }

    // Fetch document to confirm existence and optionally obtain initial content.
    const controller = new AbortController();
    const signal = controller.signal;
    const endpoint = `/api/documents/${encodeURIComponent(roomId)}`;

    let didFinish = false;
    setLoading(true);

    fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    })
      .then(async (res) => {
        if (signal.aborted) return;
        if (res.status === 404) {
          throw new Error("Document not found (invalid room).");
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(
            `Failed to load document: ${res.status} ${res.statusText} ${body}`,
          );
        }
        // Expecting a JSON body like: { content: string, meta?: {...} }
        return res.json();
      })
      .then((data) => {
        if (signal.aborted) return;
        // If backend returns an object with `content`, use it. Otherwise fallback to provided initialValue.
        if (data && typeof data.content === "string") {
          setServerContent(data.content);
        } else {
          setServerContent(initialValue ?? "");
        }
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        // Surface a clear message
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      })
      .finally(() => {
        if (signal.aborted) return;
        didFinish = true;
        setLoading(false);
      });

    return () => {
      if (!didFinish) controller.abort();
    };
    // We intentionally treat initialValue only as a fallback and do not include it in deps to avoid refetch churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, wsUrl]);

  // UI states
  if (loading) {
    return (
      <div className="h-[95%] overflow-auto" style={{ height }}>
        <div className="p-4 text-gray-600">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[95%] overflow-auto" style={{ height }}>
        <div className="p-4 text-red-600 break-words">Error: {error}</div>
      </div>
    );
  }

  // serverContent will be non-null if the fetch succeeded; otherwise we would have errored earlier.
  return (
    <div className="h-[95%] overflow-auto" style={{ height }}>
      <Collaboration
        wsUrl={wsUrl}
        roomId={roomId}
        name={name}
        initialValue={serverContent ?? initialValue}
        height={height}
      />
    </div>
  );
}
