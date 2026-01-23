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

interface CurrentFile {
  id: string;
  name: string;
  content: string;
}

type JobStatus = "queued" | "running" | "success" | "failed" | "unknown";

// Constants
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;

// Log extraction helper
const extractLogsFromJob = (jobData: any): string[] => {
  if (Array.isArray(jobData.logLines) && jobData.logLines.length > 0) {
    return jobData.logLines.filter((line: string) => line && line.length > 0);
  }
  if (typeof jobData.logs === "string" && jobData.logs.length > 0) {
    return jobData.logs
      .split("\n")
      .filter((line: string) => line && line.length > 0);
  }
  if (
    jobData.output &&
    jobData.output.logText &&
    typeof jobData.output.logText === "string"
  ) {
    return jobData.output.logText
      .split("\n")
      .filter((line: string) => line && line.length > 0);
  }
  return [];
};

const Editor: React.FC = () => {
  const { id } = useParams();
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


  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  const [logs, setLogs] = useState([
    "[system] Workspace initialized.",
    "[system] LaTeX 2.0e engine ready.",
    "[system] Collaborative session: ACTIVE",
  ]);

  const [updateWorkingFile] = useUpdateWorkingFile();
  const { data: projectData } = useGetProject({
    variables: { id: id as string },
    skip: !id,
  });

  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  // File selection
  const handleFileSelect = (
    fileId: string,
    fileName: string,
    content: string
  ) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const file = { id: fileId, name: fileName, content };
    lastCompiledContentRef.current = null;
    getCurrentContentRef.current = () => "";

    setCurrentFile(file);
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    setLogs((prev) => [...prev, `[file] Opened ${fileName}`]);

    setTimeout(() => handleRecompile(false, content), 100);
  };

  const handleAssetSelect = (assetPath: string) => {
    setLogs((prev) => [...prev, `[asset] Selected ${assetPath}`]);
  };

  const handleFilesLoaded = (
    files: Array<{ id: string; name: string }>,
    rootFileId?: string
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
        setHasUnsavedChanges(false);
        setLogs((prev) => [...prev, `[save] Saved ${file.name}`]);
      } catch (error) {
        console.error("Failed to save:", error);
        setLogs((prev) => [...prev, `[error] Failed to save ${file.name}`]);
      } finally {
        setIsSaving(false);
      }
    },
    [updateWorkingFile]
  );

  const saveFileRef = useRef(autoSave);
  useEffect(() => {
    saveFileRef.current = autoSave;
  }, [autoSave]);

  const handleContentChange = useCallback(
    (value: string) => {
      if (!currentFileRef.current) return;

      setHasUnsavedChanges(true);
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
    [saveFile]
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
    [currentFile?.content]
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

  const fetchJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/compile/${encodeURIComponent(jobId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      // FIX: Check content-type before parsing
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!res.ok) {
        console.warn(
          "Status fetch failed:",
          res.status,
          isJson ? "JSON response" : "Non-JSON response"
        );
        return null;
      }

      if (!isJson) {
        console.warn("Status response is not JSON");
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error("fetchJobStatus error", err);
      return null;
    }
  };

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

      const job: any = await fetchJobStatus(jobId);
      if (!job) {
        console.warn(
          `Poll attempt ${pollAttemptsRef.current}/${MAX_POLL_ATTEMPTS}: no response`
        );
        return;
      }

      const status: JobStatus = job.status || "unknown";
      setCompileStatus(status);

      // FIX: Get logs from the job document (backend stores them inline)
      // Priority 1: logLines array (already split by backend)
      let logsArray: string[] = [];
      
      if (Array.isArray(job.logLines) && job.logLines.length > 0) {
        logsArray = job.logLines.filter((line: string) => line && line.length > 0);
      } 
      // Priority 2: logs as string (split locally)
      else if (typeof job.logs === "string" && job.logs.length > 0) {
        logsArray = job.logs
          .split("\n")
          .filter((line: string) => line && line.length > 0);
      }
      // Priority 3: Try fetching from logUrl as last resort
      else if (job.logUrl && typeof job.logUrl === "string") {
        try {
          const logRes = await fetch(job.logUrl);
          const logContentType = logRes.headers.get("content-type");
          const isLogText = logContentType && logContentType.includes("text/plain");

          if (logRes.ok && isLogText) {
            const logText = await logRes.text();
            logsArray = logText
              .split("\n")
              .filter((line) => line && line.length > 0);
          } else {
            console.debug(
              "Log fetch: invalid response format or status",
              logRes.status
            );
          }
        } catch (logErr) {
          console.debug("Log fetch error (will retry next poll)", logErr);
        }
      }

      if (logsArray.length > 0) {
        setCompileLogs(logsArray);
      }

      if (status === "success" || status === "failed") {
        stopPolling();
        setIsCompiling(false);

        if (status === "success") {
          const pdfUrl: string | undefined =
            job.outputPdfUrl || (job.output && job.output.pdfUrl);

          if (pdfUrl && typeof pdfUrl === "string") {
            try {
              const pdfRes = await fetch(pdfUrl);

              // FIX: Check content-type for PDF
              const pdfContentType = pdfRes.headers.get("content-type");
              const isPdf = pdfContentType && pdfContentType.includes("application/pdf");

              if (pdfRes.ok && isPdf) {
                const blob = await pdfRes.blob();

                if (pdfObjectUrl) {
                  URL.revokeObjectURL(pdfObjectUrl);
                }

                const objUrl = URL.createObjectURL(blob);
                setPdfObjectUrl(objUrl);

                const durationSec = Math.round(
                  (pollAttemptsRef.current * POLL_INTERVAL_MS) / 1000
                );
                setLogs((prev) => [
                  ...prev,
                  `[compile] ✓ PDF ready (compilation took ${durationSec}s)`,
                ]);

                setTimeout(() => {
                  setShowLogs(false);
                }, 2000);
              } else if (!isPdf) {
                setLogs((prev) => [
                  ...prev,
                  `[compile] ✗ PDF response is not valid PDF (received ${pdfContentType})`,
                ]);
                setShowLogs(true);
              } else {
                setLogs((prev) => [
                  ...prev,
                  `[compile] ✗ Failed to fetch PDF: HTTP ${pdfRes.status}`,
                ]);
                setShowLogs(true);
              }
            } catch (err) {
              console.error("Failed to fetch PDF blob", err);
              const errorMsg = err instanceof Error ? err.message : String(err);
              setLogs((prev) => [
                ...prev,
                `[compile] ✗ Error fetching PDF: ${errorMsg}`,
              ]);
              setShowLogs(true);
            }
          } else {
            setLogs((prev) => [
              ...prev,
              `[compile] ✗ No PDF URL returned by server`,
            ]);
            setShowLogs(true);
          }
        } else if (status === "failed") {
          const errorMsg = job.errorMessage || "Unknown error";
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
    if (!file) {
      setLogs((prev) => [...prev, "[compile] ✗ No file open to compile"]);
      setShowLogs(true);
      return;
    }

    setIsCompiling(true);
    setCompileStatus("queued");
    setCompileJobId(null);
    setCompileLogs([]);
    setPdfObjectUrl(null);

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

    let mainFileName = file.name;
    const hasMainTex = filesPayload.some(
      (f: { name: string }) => f.name.toLowerCase() === "main.tex"
    );
    if (hasMainTex) {
      mainFileName = "main.tex";
    } else if (!mainFileName.toLowerCase().endsWith(".tex")) {
      mainFileName = mainFileName + ".tex";
    }

    const payload = {
      files: filesPayload,
      mainFile: mainFileName,
      docId: id,
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

      // FIX: Check content-type before parsing
      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      if (!res.ok) {
        let errorMessage = "Unknown error";

        if (isJson) {
          try {
            const errorData = await res.json();
            errorMessage =
              errorData.error || errorData.message || JSON.stringify(errorData);
          } catch (e) {
            errorMessage = `Server error: HTTP ${res.status}`;
          }
        } else {
          // Server returned HTML or other non-JSON response
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

      // FIX: Verify response is JSON before parsing
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
        (pollAttemptsRef.current * POLL_INTERVAL_MS) / 1000
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
      />

      {/* Main Content with React-Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with toggle button */}
        <div
          className={`bg-white border-r border-slate-200 transition-all duration-300 relative ${
            isSidebarOpen ? "w-64" : "w-0"
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
            gutterSize={4}
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
