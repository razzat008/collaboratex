import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Play,
  Download,
  Share2,
  Code2,
  Search,
  MessageSquare,
  FileText,
  Maximize2,
  Minimize2,
  ChevronRight,
  Loader2,
  Terminal,
  Activity,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import CMEditor from "../components/Editor/Codemirror";
import FileExplorer from "../components/Editor/FileExplorer";
import { useUpdateWorkingFile, useGetProject } from "@/src/graphql/generated";
import { Document, Page, pdfjs } from "react-pdf";
// Configure pdfjs worker to load from CDN. This is required for react-pdf to render.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface CurrentFile {
  id: string;
  name: string;
  content: string;
}

type JobStatus = "queued" | "running" | "success" | "failed" | "unknown";

const POLL_INTERVAL_MS = 2000;

const Editor: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get("name") || "Project Workspace";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [autoCompile, setAutoCompile] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [currentFile, setCurrentFile] = useState<CurrentFile | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isResizing, setIsResizing] = useState(false);

  // Compile states
  const [compileJobId, setCompileJobId] = useState<string | null>(null);
  const [compileStatus, setCompileStatus] = useState<JobStatus>("unknown");
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const pollerRef = useRef<number | null>(null);
  const abortPollRef = useRef<AbortController | null>(null);

  // Use refs to always have the latest values
  const currentFileRef = useRef<CurrentFile | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCompiledContentRef = useRef<string | null>(null);
  const getCurrentContentRef = useRef<() => string>(() => null);
  const autoSaveRef = useRef<boolean>(autoSave);

  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  const [logs, setLogs] = useState([
    "[system] Workspace initialized.",
    "[system] LaTeX 2.0e engine ready.",
    "[system] Collaborative session: ACTIVE",
  ]);

  // Parsed preview state removed — the editor uses the compiled PDF via react-pdf now.
  // Keeping a placeholder state is unnecessary, so we don't maintain parsed preview data here.

  const [updateWorkingFile] = useUpdateWorkingFile();
  // Fetch full project (including file contents) so we can send the entire workspace to the compiler.
  const { data: projectData } = useGetProject({
    variables: { id: id as string },
    skip: !id,
  });

  // Update ref whenever currentFile changes
  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  const handleFileSelect = (
    fileId: string,
    fileName: string,
    content: string,
  ) => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const file = { id: fileId, name: fileName, content };

    // Reset compilation ref when switching files
    lastCompiledContentRef.current = null;
    getCurrentContentRef.current = null;

    setCurrentFile(file);
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    setLogs((prev) => [...prev, `[file] Opened ${fileName}`]);

    // Compile the new file content for preview (local parsing)
    setTimeout(() => handleRecompile(false, content), 100);
  };

  const handleAssetSelect = (assetPath: string) => {
    setLogs((prev) => [...prev, `[asset] Selected ${assetPath}`]);
  };

  const handleFilesLoaded = (
    files: Array<{ id: string; name: string }>,
    rootFileId?: string,
  ) => {
    if (!isInitialLoad || files.length === 0) return;

    let defaultFile = files.find((f) => f.name.toLowerCase() === "main.tex");
    if (!defaultFile && rootFileId) {
      defaultFile = files.find((f) => f.id === rootFileId);
    }
    if (!defaultFile) {
      defaultFile = files[0];
    }

    return defaultFile.id;
  };

  const saveFile = useCallback(
    async (contentToSave?: string) => {
      const file = currentFileRef.current;
      if (!file) return;

      // ✅ Get content from Yjs if not provided
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

      setHasUnsavedChanges(true);

      // ✅ keep currentFile in sync
      setCurrentFile((prev) => (prev ? { ...prev, content: value } : prev));

      if (autoSaveRef.current) {
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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // cleanup any polling
      stopPolling();
      // revoke pdf object url
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecompile = useCallback(
    (silent = false, contentOverride?: string) => {
      // Preview parsing removed — we now rely on the compiled PDF produced by the server.
      // Keep a brief UX feedback so users know that inline preview is disabled.
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerBounds = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerBounds.left;
      const newRatio = (mouseX / containerBounds.width) * 100;
      if (newRatio > 15 && newRatio < 85) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // ----------------------------
  // Compile / Polling functions
  // ----------------------------
  const stopPolling = () => {
    if (pollerRef.current) {
      window.clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
    if (abortPollRef.current) {
      abortPollRef.current.abort();
      abortPollRef.current = null;
    }
  };

  const fetchJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/compile/${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) {
        const text = await res.text();
        console.warn("Status fetch failed:", res.status, text);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error("fetchJobStatus error", err);
      return null;
    }
  };

  const pollJob = (jobId: string) => {
    // clear previous poller if any
    stopPolling();

    abortPollRef.current = new AbortController();
    const signal = abortPollRef.current.signal;

    pollerRef.current = window.setInterval(async () => {
      if (signal.aborted) {
        stopPolling();
        return;
      }
      const job: any = await fetchJobStatus(jobId);
      if (!job) return;

      // Job document shape from server: { jobId, status, outputPdfUrl, logUrl, logs?, ... }
      const status: JobStatus = job.status || "unknown";
      setCompileStatus(status);

      // Populate compile logs from multiple possible locations:
      // - job.logs (array or string)
      // - job.logUrl (presigned URL to fetch log text)
      // - job.output?.logText (older shape)
      if (Array.isArray(job.logs)) {
        setCompileLogs(job.logs);
      } else if (typeof job.logs === "string") {
        setCompileLogs(job.logs.split("\n"));
      } else if (job.logUrl) {
        // fetch the log file if provided as a URL (presigned MinIO link)
        try {
          const logRes = await fetch(job.logUrl);
          if (logRes.ok) {
            const txt = await logRes.text();
            setCompileLogs(txt.split("\n"));
          } else {
            setCompileLogs([
              `[compile] Failed to fetch logs: ${logRes.status}`,
            ]);
          }
        } catch (err) {
          console.error("Failed to fetch job logs", err);
          setCompileLogs([`[compile] Error fetching logs: ${String(err)}`]);
        }
      } else if (job.output && job.output.logText) {
        setCompileLogs((job.output.logText as string).split("\n"));
      }

      // When finished (success / failed) stop polling and fetch outputs
      if (status === "success" || status === "failed") {
        stopPolling();
        // fetch PDF if success
        if (status === "success") {
          // The worker may return pdf URL either as top-level `outputPdfUrl` or nested in `output.pdfUrl`.
          const pdfUrl: string | undefined =
            job.outputPdfUrl || (job.output && job.output.pdfUrl);

          if (pdfUrl) {
            // fetch PDF as blob to create object URL
            try {
              const pdfRes = await fetch(pdfUrl);
              if (pdfRes.ok) {
                const blob = await pdfRes.blob();
                // revoke previous
                if (pdfObjectUrl) {
                  URL.revokeObjectURL(pdfObjectUrl);
                }
                const objUrl = URL.createObjectURL(blob);
                setPdfObjectUrl(objUrl);
                setLogs((prev) => [
                  ...prev,
                  `[compile] PDF ready for job ${jobId}`,
                ]);
              } else {
                setLogs((prev) => [
                  ...prev,
                  `[compile] Failed to fetch PDF: ${pdfRes.status}`,
                ]);
              }
            } catch (err) {
              console.error("Failed to fetch PDF blob", err);
              setLogs((prev) => [
                ...prev,
                `[compile] Error fetching PDF: ${String(err)}`,
              ]);
            }
          } else {
            setLogs((prev) => [
              ...prev,
              `[compile] No PDF URL returned by job`,
            ]);
          }
        } else {
          setLogs((prev) => [...prev, `[compile] Job ${jobId} failed`]);
        }

        setIsCompiling(false);
      } else {
        // job still pending/running
        setIsCompiling(true);
      }
    }, POLL_INTERVAL_MS);
  };

  const startCompile = async () => {
    // Gather files to send. For now we send the currently open file only.
    const file = currentFileRef.current;
    if (!file) {
      setLogs((prev) => [...prev, "[compile] No file open to compile"]);
      return;
    }

    // Optimistic UI
    setIsCompiling(true);
    setCompileStatus("queued");
    setCompileJobId(null);
    setCompileLogs([]);
    setPdfObjectUrl(null);
    setShowLogs(true);

    // Build payload containing the whole project's files (full workspace)
    // Prefer the working content (server-side) but override with the editor's current unsaved content
    // for the actively edited file so the user sees their in-editor edits compiled immediately.
    const projectFiles = projectData?.project?.files || [];

    const filesPayload = projectFiles.map((f: any) => ({
      name: f.name,
      // prefer workingFile content if present (server-side working copy), otherwise stored content
      content: f.workingFile?.content ?? f.content ?? "",
    }));

    // If the current editor has unsaved changes, prefer that content for the active file
    if (file) {
      const currentContent = getCurrentContentRef.current
        ? getCurrentContentRef.current()
        : file.content;
      const idx = filesPayload.findIndex((p) => p.name === file.name);
      if (idx >= 0) {
        filesPayload[idx].content = currentContent;
      } else {
        // If the opened file is not part of projectFiles for some reason, include it explicitly
        filesPayload.push({ name: file.name, content: currentContent });
      }
    }

    // Determine a sensible main file name to send to the worker:
    // - If the project contains a `main.tex` prefer that.
    // - Otherwise ensure the currently active file name has a `.tex` extension.
    let mainFileName = file.name;
    const hasMainTex = filesPayload.some(
      (f: { name: string }) => f.name.toLowerCase() === "main.tex",
    );
    if (hasMainTex) {
      mainFileName = "main.tex";
    } else if (!mainFileName.toLowerCase().endsWith(".tex")) {
      mainFileName = mainFileName + ".tex";
    }

    const payload = {
      files: filesPayload,
      mainFile: mainFileName,
    };

    try {
      const res = await fetch("http://localhost:8080/api/compile-inline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        setIsCompiling(false);
        setLogs((prev) => [
          ...prev,
          `[compile] Failed to enqueue job: ${res.status} ${txt}`,
        ]);
        setCompileStatus("unknown");
        return;
      }

      const body = await res.json();
      // Expect { jobId, status }
      const jobId = body.jobId || body.id || null;
      if (!jobId) {
        setIsCompiling(false);
        setLogs((prev) => [
          ...prev,
          `[compile] Invalid response from compile-inline`,
        ]);
        return;
      }

      setCompileJobId(jobId);
      setLogs((prev) => [...prev, `[compile] Job enqueued: ${jobId}`]);
      // start polling
      pollJob(jobId);
    } catch (err) {
      console.error("startCompile error", err);
      setIsCompiling(false);
      setLogs((prev) => [...prev, `[compile] Network error: ${String(err)}`]);
    }
  };

  // Expose this to UI - clicking Recompile will trigger server compile (not just preview)
  const handleCompileButton = () => {
    startCompile();
  };

  // Download PDF open in new tab
  const handleOpenPdfInNewTab = () => {
    if (!pdfObjectUrl) return;
    window.open(pdfObjectUrl, "_blank");
  };

  // Download logs as plain text
  const handleDownloadLogs = () => {
    const text = compileLogs.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${compileJobId || "compile"}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------
  // UI rendering
  // ----------------------------
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Resizing Overlay */}
      {isResizing && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* Header */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {projectName}
            </h1>
            <p className="text-xs text-slate-500">ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </div>
          )}
          {!isSaving && hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}

          <button
            onClick={() => saveFile()}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save
          </button>

          <button
            onClick={() => alert("PDF Export...")}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-200"
          >
            <Download size={16} />
            PDF
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded-lg">
            <span>Auto Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoSave ? "bg-green-600" : "bg-slate-300"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoSave ? "translate-x-4" : ""}`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 border border-slate-200 rounded-lg">
            <span>Auto Compile</span>
            <button
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoCompile ? "bg-green-600" : "bg-slate-300"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoCompile ? "translate-x-4" : ""}`}
              />
            </button>
          </div>

          <button
            onClick={() => handleCompileButton()}
            disabled={isCompiling || !currentFile}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            title="Compile project (server)"
          >
            {isCompiling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Compile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`bg-white border-r border-slate-200 transition-all duration-300 relative ${
            isSidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white absolute top-1/4 -right-3 z-30 w-6 h-6 bg-blue-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            {isSidebarOpen ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
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

        {/* Editor Area */}
        <div
          className={`flex flex-col bg-white border-r border-slate-200 ${isResizing ? "" : "transition-all duration-150"}`}
          style={{
            width:
              isPdfVisible && !isPreviewExpanded ? `${splitRatio}%` : "100%",
          }}
        >
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {currentFile?.name || "No file selected"}
              </span>
            </div>
            <button
              onClick={() => setIsPdfVisible(!isPdfVisible)}
              className={`p-1 rounded transition-colors ${!isPdfVisible ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"}`}
            >
              {isPdfVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="flex-1 flex-col h-full min-h-0 overflow-auto">
            {currentFile ? (
              <CMEditor
                key={currentFile.id}
                fileId={currentFile.id}
                initialContent={currentFile.content}
                onContentChange={handleContentChange}
                onReady={handleEditorReady}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        {isPdfVisible && !isPreviewExpanded && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors z-10 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Preview Area */}
        {isPdfVisible && (
          <div
            className={`flex flex-col bg-slate-50 ${isPreviewExpanded ? "flex-1" : ""}`}
          >
            <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4">
              <span className="text-sm font-medium text-slate-700">
                PDF Viewer
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                  className={`text-slate-400 hover:text-slate-600 transition-colors ${isPreviewExpanded ? "text-blue-600 bg-blue-50 rounded p-0.5" : ""}`}
                >
                  {isPreviewExpanded ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (pdfObjectUrl) handleOpenPdfInNewTab();
                    else if (compileJobId)
                      setLogs((prev) => [
                        ...prev,
                        `[compile] PDF not ready yet for ${compileJobId}`,
                      ]);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 relative">
              {pdfObjectUrl ? (
                // Use react-pdf to render the compiled PDF for better UX
                <div className="w-full h-full overflow-auto flex items-start justify-center p-4">
                  <div className="w-full max-w-4xl">
                    <Document
                      file={pdfObjectUrl}
                      onLoadError={(err) => {
                        console.error("Failed to load PDF:", err);
                        setLogs((prev) => [
                          ...prev,
                          `[compile] Failed to load PDF: ${String(err)}`,
                        ]);
                      }}
                      loading={
                        <div className="text-center text-slate-500 p-8">
                          Loading PDF…
                        </div>
                      }
                      noData={
                        <div className="text-center text-slate-500 p-8">
                          No PDF available
                        </div>
                      }
                    >
                      {/* Render the first page by default. You can extend to render all pages or add pagination controls. */}
                      <Page pageNumber={1} width={800} />
                    </Document>

                    <div className="mt-4 text-right">
                      <button
                        onClick={handleOpenPdfInNewTab}
                        className="text-blue-600 underline text-sm"
                      >
                        Open in new tab
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Simplified placeholder when no compiled PDF is available.
                <div className="max-w-3xl mx-auto bg-white shadow-lg p-12 min-h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="mb-2 text-lg font-medium">
                      {isCompiling ? "Compiling…" : "No compiled PDF available"}
                    </div>
                    <div className="text-sm">
                      Click <span className="font-medium">Compile</span> to
                      produce a PDF from your project. The viewer will display
                      the compiled output here.
                    </div>
                  </div>
                </div>
              )}

              {isCompiling && (
                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Compiling...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="h-48 bg-slate-900 text-slate-300 border-t border-slate-700 flex flex-col">
          <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-200">
              Compilation Logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadLogs}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Download
              </button>
              <button
                onClick={() => setShowLogs(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1">
            {compileLogs.length > 0
              ? compileLogs.map((log, i) => (
                  <div key={i} className="text-slate-400">
                    {log}
                  </div>
                ))
              : logs.map((log, i) => (
                  <div key={i} className="text-slate-400">
                    {log}
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="h-8 bg-slate-800 text-slate-400 text-xs flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Activity size={12} className="text-green-500" />
            Connected
          </span>
          <span>LaTeX 2e (pdfTeX)</span>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="hover:text-white transition-colors"
          >
            View Logs
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span>{autoSave ? "💾 Auto-save: ON" : "📝 Auto-save: OFF"}</span>
          {hasUnsavedChanges && (
            <span className="text-amber-500">● Unsaved Changes</span>
          )}
          <span>UTF-8</span>
          <button className="hover:text-white transition-colors flex items-center gap-1">
            <MessageSquare size={12} />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
