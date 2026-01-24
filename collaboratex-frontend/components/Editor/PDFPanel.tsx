import React, { useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Download, Maximize2, Minimize2, Loader2, Plus, Minus, Monitor, ExternalLink } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPanelProps {
  pdfObjectUrl: string | null;
  isCompiling: boolean;
  isPreviewExpanded: boolean;
  numPages: number;
  pageWidth: number | undefined;
  zoomLevel: number;
  pdfViewerRef: React.RefObject<HTMLDivElement>;
  onToggleExpand: () => void;
  onOpenInTab: () => void;
  onNumPagesChange: (pages: number) => void;
  onPageWidthChange: (width: number) => void;
  onZoomChange: (zoom: number) => void;
  onBaseWidthChange: (width: number) => void;
}

const PDFPanel: React.FC<PDFPanelProps> = ({
  pdfObjectUrl,
  isCompiling,
  isPreviewExpanded,
  numPages,
  pageWidth,
  zoomLevel,
  pdfViewerRef,
  onToggleExpand,
  onOpenInTab,
  onNumPagesChange,
  onPageWidthChange,
  onZoomChange,
  onBaseWidthChange,
}) => {
  useEffect(() => {
    const updateWidth = () => {
      const el = pdfViewerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      const MIN_BASE = 400;
      const MAX_BASE = 1200;
      const computedBase = Math.max(
        MIN_BASE,
        Math.min(MAX_BASE, Math.floor(rect.width - 32))
      );

      onBaseWidthChange(computedBase);
      onPageWidthChange(Math.max(200, Math.floor(computedBase * zoomLevel)));
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY;
      const step = 0.1;
      const newZoom = Math.max(
        0.25,
        Math.min(3, zoomLevel + (delta > 0 ? -step : step))
      );
      onZoomChange(newZoom);
      const el = pdfViewerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        onPageWidthChange(
          Math.max(200, Math.floor((rect.width - 32) * newZoom))
        );
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const key = e.key;
      const step = 0.1;
      if (key === "+" || key === "=") {
        e.preventDefault();
        const newZoom = Math.min(3, zoomLevel + step);
        onZoomChange(newZoom);
        const el = pdfViewerRef.current;
        const rect = el ? el.getBoundingClientRect() : null;
        const base = rect ? Math.max(400, Math.floor(rect.width - 32)) : 800;
        onPageWidthChange(Math.max(200, Math.floor(base * newZoom)));
      } else if (key === "-") {
        e.preventDefault();
        const newZoom = Math.max(0.25, zoomLevel - step);
        onZoomChange(newZoom);
        const el = pdfViewerRef.current;
        const rect = el ? el.getBoundingClientRect() : null;
        const base = rect ? Math.max(400, Math.floor(rect.width - 32)) : 800;
        onPageWidthChange(Math.max(200, Math.floor(base * newZoom)));
      }
    };

    updateWidth();
    let raf: number | null = null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        updateWidth();
        raf = null;
      });
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    const el = pdfViewerRef.current;
    if (el) {
      el.addEventListener("wheel", onWheel as any, { passive: false });
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      if (raf) cancelAnimationFrame(raf);
      if (el) el.removeEventListener("wheel", onWheel as any);
    };
  }, [zoomLevel, pdfViewerRef, onZoomChange, onPageWidthChange, onBaseWidthChange]);

  return (
    <div className={`flex flex-col bg-slate-50  ${isPreviewExpanded ? "flex-1" : ""}`}>
      {/* Header */}
      <div className="h-10 bg-white border-b sticky top-0 z-20 border-slate-200 flex items-center justify-between px-4 ">
        <span className="text-sm font-medium text-slate-700">
          PDF Viewer
        </span>

        {/* Buttons container */}
        <div className="flex items-center gap-2 ">
          {/* Expand / Minimize */}
          <button
            onClick={onToggleExpand}
            className="p-1 rounded transition-colors text-slate-400 hover:text-slate-600"
          >
            {isPreviewExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => {
              const newZoom = Math.max(0.25, zoomLevel - 0.1);
              onZoomChange(newZoom);
              const el = pdfViewerRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                onPageWidthChange(Math.max(200, Math.floor((rect.width - 32) * newZoom)));
              }
            }}
            className="px-2 py-1 rounded border bg-white text-sm hover:bg-slate-50"
          >
            <Minus size={10} />
          </button>

          <button
            onClick={() => {
              const newZoom = Math.min(3, zoomLevel + 0.1);
              onZoomChange(newZoom);
              const el = pdfViewerRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                onPageWidthChange(Math.max(200, Math.floor((rect.width - 32) * newZoom)));
              }
            }}
            className="px-2 py-1 rounded border bg-white text-sm hover:bg-slate-50"
          >
            <Plus size={10} />
          </button>

          <button
            onClick={() => {
              const el = pdfViewerRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                const base = Math.max(200, Math.floor(rect.width - 32));
                onZoomChange(1);
                onPageWidthChange(base);
              }
            }}
            className="px-2 py-1 rounded border bg-white text-sm hover:bg-slate-50"
          >
            <Monitor size={10} />
          </button>

          {/* Download icon */}
          <button
            onClick={onOpenInTab}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-0 relative">
        {pdfObjectUrl ? (
          <div
            className="w-full h-full overflow-auto flex items-start justify-center p-1"
            ref={pdfViewerRef}
          >
            <div className="w-full max-w-5xl flex flex-col items-center">
              <Document
                file={pdfObjectUrl}
                onLoadSuccess={(pdf) => {
                  const n = (pdf && (pdf as any).numPages) || 0;
                  onNumPagesChange(n);
                }}
                loading={
                  <div className="text-center text-slate-500 p-1">
                    Loading PDF…
                  </div>
                }
                noData={
                  <div className="text-center text-slate-500 p-1">
                    No PDF available
                  </div>
                }
              >
                <div className="w-full flex flex-col items-center">
                  {Array.from({ length: numPages }).map((_, i) => (
                    <div key={i + 1} className="mb-2 w-full flex justify-center">
                      <Page
                        pageNumber={i + 1}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                          <div className="text-center p-1 text-slate-500">
                            Rendering page…
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </Document>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white shadow-lg p-12 min-h-full flex items-center justify-center">
            <div className="text-center text-slate-500">
              <div className="mb-2 text-lg font-medium">
                {isCompiling ? "Compiling…" : "No compiled PDF available"}
              </div>
              <div className="text-sm">
                Click <span className="font-medium">Compile</span> to produce a
                PDF from your project. The viewer will display the compiled
                output here.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PDFPanel;

