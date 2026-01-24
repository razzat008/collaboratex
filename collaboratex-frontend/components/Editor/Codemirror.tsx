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
  onContentChange?: (content: string) => void;
  onReady?: (getCurrentContent: () => string) => void; // ✅ Add this
}

/* ------------------ editor ------------------ */
export default function CMEditor({ fileId, initialContent, onContentChange, onReady }: CMEditorProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const username = user?.firstName ?? "Anonymous";
  const userColor = useMemo(() => randomColor(), []);
  const yTextRef = useRef<Y.Text | null>(null);
  const observerRef = useRef<((event: Y.YTextEvent) => void) | null>(null);
  const onContentChangeRef = useRef<((content: string) => void) | null>(null);


  useEffect(() => {
    onContentChangeRef.current = onContentChange ?? null;
  }, [onContentChange]);

  useEffect(() => {
    console.log('[CMEditor] Mounting for fileId:', fileId);

    if (!editorRef.current || !projectId || !isLoaded || !fileId) {
      console.log('[CMEditor] Skipping init - missing requirements');
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
          console.log('[CMEditor] Init cancelled or no token');
          return;
        }

        // Create Yjs document
        ydoc = new Y.Doc();
        const docName = `${projectId}/${fileId}`;
        const yText = ydoc.getText("codemirror");
        yTextRef.current = yText; // ✅ Store reference

        // Create WebSocket provider FIRST (before setting content)
        provider = new WebsocketProvider(
          "ws://localhost:1234",
          docName,
          ydoc,
          {
            params: { token },
            connect: true,
          }
        );

        console.log('[CMEditor] Provider created for:', docName);

        // Set awareness
        provider.awareness.setLocalStateField("user", {
          name: username,
          color: userColor,
        });

        // Event listeners
        provider.on('status', (event: { status: string }) => {
          console.log(`[YJS] Status: ${event.status}`);
        });

        provider.on('sync', (isSynced: boolean) => {
          console.log(`[YJS] Synced: ${isSynced}`);

          // Only set initial content AFTER first sync AND if doc is empty
          if (isSynced && yText.length === 0 && initialContent) {
            console.log('[CMEditor] Setting initial content after sync');
            yText.insert(0, initialContent);
          }
        });

        if (cancelled) {
          console.log('[CMEditor] Cancelled before editor creation');
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
            }), EditorView.lineWrapping
          ],
        });

        view = new EditorView({
          state,
          parent: editorRef.current!,
        });

        console.log('[CMEditor] Editor created successfully');

        // Observe changes for parent callback using ref
        const observer = () => {
          const content = yText.toString();
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
        console.error('[CMEditor] Init error:', error);
      }
    };

    init();

    return () => {
      console.log('[CMEditor] Cleanup for fileId:', fileId);
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

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div ref={editorRef} style={{ height: "100%" }} />
    </div>
  );
}
