import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Split from "react-split";
import CMEditor from "../components/Editor/Codemirror";
import FileExplorer from "../components/Editor/FileExplorer";
import CompileLogs from "../components/Editor/CompileLogs";
import TopBar from "../components/Editor/TopBar";
import Footer from "../components/Editor/Footer";
import EditorPanel from "../components/Editor/EditorPanel";
import PDFPanel from "../components/Editor/PDFPanel";
import ChatPopup from "../components/Editor/ChatPopup";
import { useUpdateWorkingFile, useGetProject } from "@/src/graphql/generated";
import { useAuth } from "@clerk/clerk-react";

interface CurrentFile {
  id: string;
  name: string;
  content: string;
}

type JobStatus = "queued" | "running" | "success" | "failed" | "unknown";

// Constants
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;
const API_BASE_URL = "http://localhost:8080";

const Editor: React.FC = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get("name") || "Project Workspace";

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [autoCompile, setAutoCompile] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentFile, setCurrentFile] = useState<CurrentFile | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Compile states
  const [compileJobId, setCompileJobId] = useState<string | null>(null);
  const [compileStatus, setCompileStatus] = useState<JobStatus>("unknown");
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  //chat popup
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Load PDF from cache on mount
  useEffect(() => {
    if (!id) return;

    const cachedJobId = localStorage.getItem(`pdf_jobId_${id}`);
    if (cachedJobId) {
      // Try to fetch the cached PDF
      fetchPDF(cachedJobId).then((blob) => {
        if (blob) {
          const objUrl = URL.createObjectURL(blob);
          setPdfObjectUrl(objUrl);
          setCompileJobId(cachedJobId);
          setLogs((prev) => [
            ...prev,
            `[system] Restored PDF from last compilation`,
          ]);
        } else {
          // PDF no longer available, clear cache
          localStorage.removeItem(`pdf_jobId_${id}`);
        }
      });
    }
  }, [id]);

  // Polling refs
  const pollAttemptsRef = useRef<number>(0);
  const pollerRef = useRef<number | null>(null);
  const abortPollRef = useRef<AbortController | null>(null);

  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(0);
  const [baseWidth, setBaseWidth] = useState<number>(800);
  const [pageWidth, setPageWidth] = useState<number | undefined>(800);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Refs
  const currentFileRef = useRef<CurrentFile | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pdfViewerRef = useRef<HTMLDivElement | null>(null);
  const lastCompiledContentRef = useRef<string | null>(null);
  const getCurrentContentRef = useRef<() => string>(() => "");
  const autoSaveRef = useRef<boolean>(autoSave);
  // Track the base (last loaded or saved) content for the currently-open file.
  // Unsaved-change detection should compare against this base value instead of
  // the ephemeral currentFile.content which may change as the editor updates.
  const baseContentRef = useRef<string | null>(null);

  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  const [logs, setLogs] = useState([
    "[system] Workspace initialized.",
    "[system] LaTeX 2.0e engine ready.",
    "[system] Collaborative session: ACTIVE",
  ]);

  const [updateWorkingFile] = useUpdateWorkingFile();
  const { data: projectData, refetch: refetchProject } = useGetProject({
    variables: { id: id as string },
    skip: !id,
  });

  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  // Called after a version restore completes. This will refetch the project
  // data and update the currently-open file (if any) with the restored working-file content
  // so the editor updates without a manual page refresh.
  const handleAfterRestore = async () => {
    try {
      if (typeof refetchProject === "function") {
        const res = await refetchProject();
        const proj = res?.data?.project;
        if (proj && currentFile) {
          const updated = (proj.files || []).find(
            (f: any) => f.id === currentFile.id,
          );
          if (updated) {
            const content = updated.workingFile?.content ?? "";
            // Update the editor's current file and set the base content to the restored value
            setCurrentFile({ id: updated.id, name: updated.name, content });
            baseContentRef.current = content;
            setHasUnsavedChanges(false);
            setLogs((prev) => [...prev, `[system] Restored ${updated.name}`]);
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error refetching project after restore", e);
    }
  };

  // File selection
  const handleFileSelect = (
    fileId: string,
    fileName: string,
    content: string,
  ) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const file = { id: fileId, name: fileName, content };
    lastCompiledContentRef.current = null;
    getCurrentContentRef.current = () => "";

    // Set current file and establish the base content (no unsaved changes immediately)
    setCurrentFile(file);
    baseContentRef.current = content;
    setHasUnsavedChanges(false); // File just loaded, no unsaved changes
    setIsInitialLoad(false);
    setLogs((prev) => [...prev, `[file] Opened ${fileName}`]);

    // Don't auto-compile on file select
  };

  const handleAssetSelect = (assetPath: string) => {
    setLogs((prev) => [...prev, `[asset] Selected ${assetPath}`]);
  };

  const handleFilesLoaded = (
    files: Array<{ id: string; name: string; workingFile?: { content: string } }>,
    rootFileId?: string,
  ) => {
    if (!isInitialLoad || files.length === 0) return;

    // 1. Get all .tex files
    const texFiles = files.filter((f) => f.name.toLowerCase().endsWith(".tex"));

    // 2. Find the one that actually has content (prioritize the template over the empty ghost file)
    let defaultFile = texFiles.find((f) => (f.workingFile?.content?.length ?? 0) > 0);

    // 3. Fallback to rootFileId if content check fails
    if (!defaultFile && rootFileId) {
      defaultFile = files.find((f) => f.id === rootFileId);
    }

    // 4. Fallback to just any .tex file
    if (!defaultFile && texFiles.length > 0) {
      defaultFile = texFiles[0];
    }

    // 5. Absolute fallback
    if (!defaultFile) {
      defaultFile = files[0];
    }

    return defaultFile.id;
  };

  // File saving
  const saveFile = useCallback(
    async (contentToSave?: string) => {
      const file = currentFileRef.current;
      if (!file) return;

      const content =
        contentToSave ??
        (getCurrentContentRef.current
          ? getCurrentContentRef.current()
          : file.content);

      try {
        setIsSaving(true);
        await updateWorkingFile({
          variables: {
            input: {
              fileId: file.id,
              content: content,
            },
          },
        });

        // Update the current file's base content after successful save
        setCurrentFile((prev) => (prev ? { ...prev, content } : prev));
        // Update the baseContentRef so future edits compare against the saved content
        baseContentRef.current = content;
        setHasUnsavedChanges(false);
        setLogs((prev) => [...prev, `[save] Saved ${file.name}`]);
      } catch (error) {
        console.error("Failed to save:", error);
        setLogs((prev) => [...prev, `[error] Failed to save ${file.name}`]);
      } finally {
        setIsSaving(false);
      }
    },
    [updateWorkingFile],
  );

  const saveFileRef = useRef(autoSave);
  useEffect(() => {
    saveFileRef.current = autoSave;
  }, [autoSave]);

  const handleContentChange = useCallback(
    (value: string) => {
      if (!currentFileRef.current) return;

      // If baseContentRef hasn't been initialized yet (e.g. during initial CRDT sync),
      // update the current file content shown in the editor but do NOT mark the editor
      // as having unsaved changes. This prevents spurious "unsaved changes" immediately
      // after the editor syncs its initial content from the server/CRDT.
      if (baseContentRef.current === null) {
        setCurrentFile((prev) => (prev ? { ...prev, content: value } : prev));
        return;
      }

      // Only mark as unsaved if content actually changed from the base content
      // (baseContentRef is set when a file is loaded, after a successful save, or after a restore)
      const base =
        baseContentRef.current ?? currentFileRef.current?.content ?? "";
      const hasChanged = value !== base;
      setHasUnsavedChanges(hasChanged);

      // Update current file content (but don't replace the original base)
      setCurrentFile((prev) => (prev ? { ...prev, content: value } : prev));

      if (autoSaveRef.current && hasChanged) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          saveFile(value);
        }, 2000);
      }
    },
    [saveFile],
  );

  const handleEditorReady = useCallback((getCurrentContent: () => string) => {
    getCurrentContentRef.current = getCurrentContent;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      stopPolling();
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
  }, [pdfObjectUrl]);

  // Recompile logic
  const handleRecompile = useCallback(
    (silent = false, contentOverride?: string) => {
      const content = contentOverride ?? currentFile?.content;
      if (!content) return;

      if (content === lastCompiledContentRef.current) return;
      lastCompiledContentRef.current = content;

      if (!silent) setIsCompiling(true);

      setTimeout(() => {
        if (!silent) {
          setLogs((prev) => [
            ...prev,
            `[compilation] Inline preview disabled — click Compile to produce a PDF.`,
          ]);
          setIsCompiling(false);
        }
      }, 300);
    },
    [currentFile?.content],
  );

  useEffect(() => {
    if (!autoCompile || !currentFile) return;
    const timer = setTimeout(() => handleRecompile(true), 1500);
    return () => clearTimeout(timer);
  }, [currentFile?.content, autoCompile, handleRecompile]);

  // Polling functions
  const stopPolling = () => {
    if (pollerRef.current) {
      window.clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
    if (abortPollRef.current) {
      abortPollRef.current.abort();
      abortPollRef.current = null;
    }
    pollAttemptsRef.current = 0;
  };

  // NEW: Simplified status fetcher - now returns status + logs in one call
  const fetchJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/compile/${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        console.warn("Status fetch failed:", res.status);
        return null;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.warn("Status response is not JSON");
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error("fetchJobStatus error", err);
      return null;
    }
  };

  // NEW: Fetch PDF directly from the new endpoint
  const fetchPDF = useCallback(async (jobId: string): Promise<Blob | null> => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/compile/${encodeURIComponent(jobId)}/pdf`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        },
      );

      if (!res.ok) {
        console.warn("PDF fetch failed:", res.status);
        return null;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/pdf")) {
        console.warn("PDF response is not a PDF:", contentType);
        return null;
      }

      return await res.blob();
    } catch (err) {
      console.error("fetchPDF error", err);
      return null;
    }
  }, []);

  const pollJob = (jobId: string) => {
    stopPolling();

    abortPollRef.current = new AbortController();
    const signal = abortPollRef.current.signal;
    pollAttemptsRef.current = 0;

    pollerRef.current = window.setInterval(async () => {
      pollAttemptsRef.current++;

      if (signal.aborted || pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setIsCompiling(false);
        setCompileStatus("failed");
        const timeoutMsg = `[compile] ✗ Poll timeout after ${pollAttemptsRef.current} attempts (${Math.round((pollAttemptsRef.current * POLL_INTERVAL_MS) / 1000)}s)`;
        setLogs((prev) => [...prev, timeoutMsg]);
        setShowLogs(true);
        return;
      }

      // NEW: Get status + logs in one call
      const job: any = await fetchJobStatus(jobId);
      if (!job) {
        console.warn(
          `Poll attempt ${pollAttemptsRef.current}/${MAX_POLL_ATTEMPTS}: no response`,
        );
        return;
      }

      const status: JobStatus = job.status || "unknown";
      setCompileStatus(status);

      // NEW: Logs are now directly in the response (from Redis)
      if (job.logs && typeof job.logs === "string") {
        const logsArray = job.logs
          .split("\n")
          .filter((line: string) => line && line.trim().length > 0);

        if (logsArray.length > 0) {
          setCompileLogs(logsArray);
        }
      }

      // Terminal states
      if (status === "success" || status === "failed") {
        stopPolling();
        setIsCompiling(false);

        if (status === "success") {
          // NEW: Fetch PDF from the new direct endpoint
          const pdfBlob = await fetchPDF(jobId);

          if (pdfBlob) {
            // Clean up old PDF URL
            if (pdfObjectUrl) {
              URL.revokeObjectURL(pdfObjectUrl);
            }

            const objUrl = URL.createObjectURL(pdfBlob);
            setPdfObjectUrl(objUrl);

            // Cache the job ID for page refresh persistence
            if (id) {
              localStorage.setItem(`pdf_jobId_${id}`, jobId);
            }

            const durationSec = Math.round(
              (pollAttemptsRef.current * POLL_INTERVAL_MS) / 1000,
            );
            setLogs((prev) => [
              ...prev,
              `[compile] ✓ PDF ready (compilation took ${durationSec}s)`,
            ]);

            // Auto-hide logs after success
            setTimeout(() => {
              setShowLogs(false);
            }, 2000);
          } else {
            setLogs((prev) => [
              ...prev,
              `[compile] ✗ Failed to fetch PDF from server`,
            ]);
            setShowLogs(true);
          }
        } else if (status === "failed") {
          const errorMsg = job.error || "Unknown error";
          setLogs((prev) => [
            ...prev,
            `[compile] ✗ Compilation failed: ${errorMsg}`,
          ]);
          setShowLogs(true);
        }
      }
    }, POLL_INTERVAL_MS);
  };

  const startCompile = async () => {
    const file = currentFileRef.current;
    const token = await getToken();
    if (!file) {
      setLogs((prev) => [...prev, "[compile] ✗ No file open to compile"]);
      setShowLogs(true);
      return;
    }

    setIsCompiling(true);
    setCompileStatus("queued");
    setCompileJobId(null);
    setCompileLogs([]);

    // Clean up old PDF
    if (pdfObjectUrl) {
      URL.revokeObjectURL(pdfObjectUrl);
      setPdfObjectUrl(null);
    }

    const projectFiles = projectData?.project?.files || [];

    const filesPayload = projectFiles.map((f: any) => ({
      name: f.name,
      content: f.workingFile?.content ?? f.content ?? "",
    }));

    if (file) {
      const currentContent = getCurrentContentRef.current
        ? getCurrentContentRef.current()
        : file.content;
      const idx = filesPayload.findIndex((p) => p.name === file.name);
      if (idx >= 0) {
        filesPayload[idx].content = currentContent;
      } else {
        filesPayload.push({ name: file.name, content: currentContent });
      }
    }

    const texFile = filesPayload.find((f: { name: string }) =>
      f.name.toLowerCase().endsWith(".tex")
    );

    const mainFileName = texFile ? texFile.name : file.name;


    const payload = {
      files: filesPayload,
      mainFile: mainFileName,
      docId: id,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/compile-inline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      if (!res.ok) {
        let errorMessage = "Unknown error";

        if (isJson) {
          try {
            const errorData = await res.json();
            errorMessage =
              errorData.error || errorData.details || JSON.stringify(errorData);
          } catch (e) {
            errorMessage = `Server error: HTTP ${res.status}`;
          }
        } else {
          errorMessage = `Server error: HTTP ${res.status} (Invalid response format)`;
        }

        setIsCompiling(false);
        setCompileStatus("failed");
        setLogs((prev) => [
          ...prev,
          `[compile] ✗ Failed to enqueue job`,
          `[compile] Error: ${errorMessage}`,
        ]);
        setShowLogs(true);
        return;
      }

      if (!isJson) {
        setIsCompiling(false);
        setCompileStatus("failed");
        setLogs((prev) => [
          ...prev,
          `[compile] ✗ Server returned invalid response format (expected JSON)`,
        ]);
        setShowLogs(true);
        return;
      }

      const body = await res.json();
      const jobId = body.jobId || body.id || null;

      if (!jobId) {
        setIsCompiling(false);
        setCompileStatus("failed");
        setLogs((prev) => [
          ...prev,
          `[compile] ✗ Server returned invalid job ID`,
        ]);
        setShowLogs(true);
        return;
      }

      setCompileJobId(jobId);
      const shortId = jobId.slice(0, 8);
      setLogs((prev) => [
        ...prev,
        `[compile] ⏳ Job enqueued: ${shortId}... (waiting in queue)`,
      ]);

      pollJob(jobId);
    } catch (err) {
      console.error("startCompile error", err);
      setIsCompiling(false);
      setCompileStatus("failed");

      let errorMessage = "Unknown network error";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setLogs((prev) => [
        ...prev,
        `[compile] ✗ Network error: ${errorMessage}`,
      ]);
      setShowLogs(true);
    }
  };

  const getCompileButtonState = () => {
    if (isCompiling) {
      const elapsedSec = Math.round(
        (pollAttemptsRef.current * POLL_INTERVAL_MS) / 1000,
      );
      return {
        disabled: true,
        text: `Compiling... (${elapsedSec}s)`,
      };
    }
    return {
      disabled: !currentFile,
      text: "Compile",
    };
  };

  const handleOpenPdfInNewTab = () => {
    if (!pdfObjectUrl) return;
    window.open(pdfObjectUrl, "_blank");
  };

  const compileState = getCompileButtonState();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* TopBar */}
      <TopBar
        projectName={projectName}
        projectId={id}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        autoSave={autoSave}
        autoCompile={autoCompile}
        isCompiling={isCompiling}
        currentFile={currentFile}
        compileState={compileState}
        onSave={() => saveFile()}
        onAutoSaveToggle={() => setAutoSave(!autoSave)}
        onAutoCompileToggle={() => setAutoCompile(!autoCompile)}
        onCompile={() => startCompile()}
        onAfterRestore={handleAfterRestore}
      />

      {/* Main Content with React-Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with toggle button */}
        <div
          className={`bg-white border-r border-slate-200 transition-all duration-300 relative ${isSidebarOpen ? "w-64" : "w-0"
            }`}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white absolute top-1/4 -right-3 z-30 w-6 h-6 bg-blue-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>

          {isSidebarOpen && (
            <FileExplorer
              isOpen={isSidebarOpen}
              activeFileId={currentFile?.id || ""}
              onFileSelect={handleFileSelect}
              onAssetSelect={handleAssetSelect}
              onFilesLoaded={handleFilesLoaded}
            />
          )}
        </div>

        {/* Editor and PDF with React-Split */}
        {isPdfVisible && !isPreviewExpanded ? (
          <Split
            className="flex flex-1"
            sizes={[50, 50]}
            minSize={[300, 300]}
            gutterSize={10}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
          >
            <div className="flex-1 flex-col h-full min-h-0 overflow-auto">
              <EditorPanel
                currentFile={currentFile}
                isPdfVisible={isPdfVisible}
                onTogglePdf={() => setIsPdfVisible(!isPdfVisible)}
              >
                {currentFile ? (
                  <CMEditor
                    fileId={currentFile.id}
                    initialContent={currentFile.content}
                    externalContent={currentFile.content}
                    onContentChange={handleContentChange}
                    onReady={handleEditorReady}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <p>Select a file to start editing</p>
                    </div>
                  </div>
                )}
              </EditorPanel>
            </div>

            <div className="flex flex-col h-full min-h-0 overflow-auto">
              <PDFPanel
                pdfObjectUrl={pdfObjectUrl}
                isCompiling={isCompiling}
                isPreviewExpanded={isPreviewExpanded}
                numPages={numPages}
                pageWidth={pageWidth}
                zoomLevel={zoomLevel}
                pdfViewerRef={pdfViewerRef}
                onToggleExpand={() => setIsPreviewExpanded(!isPreviewExpanded)}
                onOpenInTab={handleOpenPdfInNewTab}
                onNumPagesChange={setNumPages}
                onPageWidthChange={setPageWidth}
                onZoomChange={setZoomLevel}
                onBaseWidthChange={setBaseWidth}
              />
            </div>
          </Split>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!isPreviewExpanded ? (
              <EditorPanel
                currentFile={currentFile}
                isPdfVisible={isPdfVisible}
                onTogglePdf={() => setIsPdfVisible(!isPdfVisible)}
              >
                {currentFile ? (
                  <CMEditor
                    fileId={currentFile.id}
                    initialContent={currentFile.content}
                    externalContent={currentFile.content}
                    onContentChange={handleContentChange}
                    onReady={handleEditorReady}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <p>Select a file to start editing</p>
                    </div>
                  </div>
                )}
              </EditorPanel>
            ) : (
              <PDFPanel
                pdfObjectUrl={pdfObjectUrl}
                isCompiling={isCompiling}
                isPreviewExpanded={isPreviewExpanded}
                numPages={numPages}
                pageWidth={pageWidth}
                zoomLevel={zoomLevel}
                pdfViewerRef={pdfViewerRef}
                onToggleExpand={() => setIsPreviewExpanded(!isPreviewExpanded)}
                onOpenInTab={handleOpenPdfInNewTab}
                onNumPagesChange={setNumPages}
                onPageWidthChange={setPageWidth}
                onZoomChange={setZoomLevel}
                onBaseWidthChange={setBaseWidth}
              />
            )}
          </div>
        )}
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <CompileLogs
          compileLogs={compileLogs}
          logs={logs}
          jobId={compileJobId}
          onClose={() => setShowLogs(false)}
          className="border-t-2 border-slate-600 rounded-t-md"
        />
      )}

      {/* Footer */}
      <Footer
        showLogs={showLogs}
        autoSave={autoSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onToggleLogs={() => setShowLogs(!showLogs)}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setHasUnreadChat(false); // Clear unread when opening
        }}
        isChatOpen={isChatOpen}
        hasUnreadChat={hasUnreadChat}
      />

      {/* Chat Popup */}
      <ChatPopup
        roomId={id as string}
        projectName={projectName}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        onNewMessage={() => setHasUnreadChat(true)}
      />
    </div>
  );
};

export default Editor;
