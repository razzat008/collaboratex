import React, { useEffect, useMemo, useRef } from "react";

interface Props {
  compileLogs?: string[];
  logs?: string[];
  jobId?: string | null;
  onClose?: () => void;
  visible?: boolean;
  className?: string;
}

/**
 * splitRaw
 *
 * Preserve raw log lines without removing HTML. We simply split each entry on newlines
 * and display the text as-is so the UI shows raw messages only.
 */
function splitRaw(entry: string): string[] {
  if (!entry) return [];
  // If entry is a JSON encoded array, try to parse and flatten (best-effort).
  try {
    const parsed = JSON.parse(entry);
    if (Array.isArray(parsed)) {
      return parsed.flatMap((p) => splitRaw(String(p)));
    }
  } catch {
    // ignore parse errors and treat entry as plain text
  }
  return entry.split(/\r\n|\n|\r/);
}

const CompileLogs: React.FC<Props> = ({
  compileLogs = [],
  logs = [],
  jobId = null,
  onClose,
  visible = true,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Prefer compileLogs from the server; otherwise fall back to editor logs.
  const source = useMemo(
    () => (compileLogs && compileLogs.length > 0 ? compileLogs : logs || []),
    [compileLogs, logs],
  );

  // Flatten entries preserving raw content (no HTML stripping) into display lines
  const displayLines = useMemo(() => {
    const lines: string[] = [];
    for (const e of source) {
      const parts = splitRaw(e);
      if (parts && parts.length > 0) {
        for (const p of parts) lines.push(p);
      } else if (e !== undefined && e !== null) {
        lines.push(String(e));
      }
    }
    // If nothing found, show a helpful placeholder
    if (lines.length === 0) return ["[compile] (no logs available)"];
    return lines;
  }, [source]);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // allow a render frame, then scroll
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [displayLines.length]);

  const handleDownload = () => {
    const text = displayLines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jobId || "compile"}.log`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const text = displayLines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // best-effort: ignore copy errors
      console.warn("Copy to clipboard failed", err);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`h-48 bg-slate-900 text-slate-300 border border-slate-700 flex flex-col ${className} rounded-t-md`}
      role="region"
      aria-label="Compilation logs"
    >
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-200">
            Compilation Logs
          </span>
          {jobId && (
            <span className="text-xs text-slate-400">Job: {jobId}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Download
          </button>
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Copy
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
              title="Close logs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1"
        data-testid="compile-logs-container"
      >
        {displayLines.map((line, i) => (
          <div key={i} className="text-slate-400 whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>

      <div className="h-8 bg-slate-800 border-t border-slate-700 px-3 flex items-center justify-between text-xs text-slate-400 rounded-b-md">
        <div>
          {displayLines.length > 0 ? `${displayLines.length} line(s)` : ""}
        </div>
        <div className="opacity-80">Raw messages</div>
      </div>
    </div>
  );
};

export default CompileLogs;
