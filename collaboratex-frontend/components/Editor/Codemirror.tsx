import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { yCollab } from "y-codemirror.next";
import { latex } from "codemirror-lang-latex";
import { useUser, useAuth } from "@clerk/clerk-react";

/* ------------------ utils ------------------ */
function randomColor(): string {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

/* ------------------ props ------------------ */
interface CMEditorProps {
  fileId: string;
  initialContent: string;
  // externalContent: optional prop which, when changed by the parent (e.g. after a restore/refetch),
  // will replace the CRDT Y.Text contents in the editor so the editor reflects the new working-file content.
  externalContent?: string;
  onContentChange?: (content: string) => void;
  onReady?: (getCurrentContent: () => string) => void; // ✅ Add this
}

/* ------------------ editor ------------------ */
export default function CMEditor({
  fileId,
  initialContent,
  onContentChange,
  onReady,
  externalContent,
}: CMEditorProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const username = user?.firstName ?? "Anonymous";
  const userColor = useMemo(() => randomColor(), []);
  const yTextRef = useRef<Y.Text | null>(null);
  const observerRef = useRef<((event: Y.YTextEvent) => void) | null>(null);
  const onContentChangeRef = useRef<((content: string) => void) | null>(null);
  // When applying external content programmatically we temporarily suppress invoking
  // the parent's onContentChange callback to avoid marking the editor as having
  // unsaved changes from this automated update.
  const applyingExternalRef = useRef<boolean>(false);

  useEffect(() => {
    onContentChangeRef.current = onContentChange ?? null;
  }, [onContentChange]);

  useEffect(() => {
    console.log("[CMEditor] Mounting for fileId:", fileId);

    if (!editorRef.current || !projectId || !isLoaded || !fileId) {
      console.log("[CMEditor] Skipping init - missing requirements");
      return;
    }

    let view: EditorView | null = null;
    let provider: WebsocketProvider | null = null;
    let ydoc: Y.Doc | null = null;
    let cancelled = false;

    const init = async () => {
      try {
        const token = await getToken({ skipCache: true });
        if (cancelled || !token) {
          console.log("[CMEditor] Init cancelled or no token");
          return;
        }

        // Create Yjs document
        ydoc = new Y.Doc();
        const docName = `${projectId}/${fileId}`;
        const yText = ydoc.getText("codemirror");
        yTextRef.current = yText; // ✅ Store reference

        // Create WebSocket provider FIRST (before setting content)
        provider = new WebsocketProvider("ws://localhost:1234", docName, ydoc, {
          params: { token },
          connect: true,
        });

        console.log("[CMEditor] Provider created for:", docName);

        // Set awareness
        provider.awareness.setLocalStateField("user", {
          name: username,
          color: userColor,
        });

        // Event listeners
        provider.on("status", (event: { status: string }) => {
          console.log(`[YJS] Status: ${event.status}`);
        });

        provider.on("sync", (isSynced: boolean) => {
          console.log(`[YJS] Synced: ${isSynced}`);

          // Only set initial content AFTER first sync AND if doc is empty
          if (isSynced && yText.length === 0 && initialContent) {
            console.log("[CMEditor] Setting initial content after sync");
            yText.insert(0, initialContent);
          }
        });

        if (cancelled) {
          console.log("[CMEditor] Cancelled before editor creation");
          provider.destroy();
          ydoc.destroy();
          return;
        }

        // Create CodeMirror editor
        const state = EditorState.create({
          doc: yText.toString(),
          extensions: [
            basicSetup,
            latex(),
            yCollab(yText, provider.awareness),
            EditorView.theme({
              "&": { height: "100%" },
              ".cm-scroller": { overflowX: "hidden" },
              ".cm-content": {
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              },
            }),
            EditorView.lineWrapping,
          ],
        });

        view = new EditorView({
          state,
          parent: editorRef.current!,
        });

        console.log("[CMEditor] Editor created successfully");

        // Observe changes for parent callback using ref
        const observer = () => {
          const content = yText.toString();
          // If we are applying external content programmatically, suppress the
          // parent callback to avoid spurious unsaved-change state.
          if (applyingExternalRef.current) {
            return;
          }
          // Use ref to get latest callback
          if (onContentChangeRef.current) {
            onContentChangeRef.current(content);
          }
        };
        yText.observe(observer);
        observerRef.current = observer;

        // ✅ Notify parent that editor is ready with getCurrentContent function
        if (onReady) {
          onReady(() => yText.toString());
        }
      } catch (error) {
        console.error("[CMEditor] Init error:", error);
      }
    };

    init();

    return () => {
      console.log("[CMEditor] Cleanup for fileId:", fileId);
      cancelled = true;

      // Clear yText reference
      yTextRef.current = null;

      // Unobserve before destroying
      if (observerRef.current && ydoc) {
        const yText = ydoc.getText("codemirror");
        yText.unobserve(observerRef.current);
        observerRef.current = null;
      }

      view?.destroy();
      provider?.destroy();
      ydoc?.destroy();
      view = null;
      provider = null;
      ydoc = null;
    };
  }, [projectId, fileId, isLoaded]); // CRITICAL: Only these dependencies

  // Apply external content updates (e.g. after a version restore + refetch).
  // If the parent supplies `externalContent`, and it differs from the current Y.Text contents,
  // replace the Y.Text contents so the editor reflects the new working-file content.
  useEffect(() => {
    if (typeof externalContent === "undefined" || externalContent === null) {
      // Nothing to apply
      return;
    }

    const yText = yTextRef.current;
    if (!yText) {
      // Provider / document not yet initialized; skip. When the provider syncs it will
      // set initial content from `initialContent` and subsequent changes will be reflected.
      return;
    }

    try {
      const current = yText.toString();
      if (current === externalContent) {
        // Already in sync; nothing to do
        return;
      }

      // Use a transaction so the change is atomic and propagates to other collaborators
      const doc = yText.doc;

      // Mark that we're applying external content so the observer doesn't treat this
      // programmatic update as a user edit (which would set hasUnsavedChanges).
      applyingExternalRef.current = true;
      try {
        if (doc) {
          doc.transact(() => {
            yText.delete(0, yText.length);
            if (externalContent) yText.insert(0, externalContent);
          });
        } else {
          // Fallback when doc isn't available (shouldn't normally happen)
          yText.delete(0, yText.length);
          if (externalContent) yText.insert(0, externalContent);
        }

        console.log("[CMEditor] externalContent applied to yText");
      } finally {
        // Ensure suppression flag is cleared even if the transaction throws
        applyingExternalRef.current = false;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[CMEditor] Failed to apply externalContent", err);
      // clear flag in case of unexpected exception
      applyingExternalRef.current = false;
    }
    // Only re-run when externalContent changes
  }, [externalContent]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div ref={editorRef} style={{ height: "100%" }} />
    </div>
  );
}
