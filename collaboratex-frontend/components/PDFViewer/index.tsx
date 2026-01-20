import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

/**
 * PDFViewer
 *
 * A small reusable PDF viewer component with:
 * - continuous vertical scroll (all pages stacked)
 * - responsive fit-to-container base width
 * - zoom controls (+ / - / Fit)
 * - Ctrl/Cmd + wheel zoom support
 * - small gap between pages (configurable)
 * - text/annotation layers disabled to avoid duplicated HTML text rendering
 *
 * Note: The application should configure `pdfjs.GlobalWorkerOptions.workerSrc`
 * once at app entry (this file does not configure the worker).
 */

type Props = {
  fileUrl: string | null | undefined;
  gap?: number; // px gap between pages
  initialZoom?: number; // multiplier, 1 = fit
  minZoom?: number;
  maxZoom?: number;
  className?: string;
};

export default function PDFViewer({
  fileUrl,
  gap = 8,
  initialZoom = 1,
  minZoom = 0.25,
  maxZoom = 3,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // baseWidth = computed fit-to-container width (in px)
  const [baseWidth, setBaseWidth] = useState<number>(800);
  // zoom multiplier
  const [zoom, setZoom] = useState<number>(initialZoom);

  // derived effective width used for Page.width
  const effectiveWidth = Math.max(200, Math.floor(baseWidth * zoom));

  // when PDF loads, set number of pages
  const onLoadSuccess = useCallback((pdf: any) => {
    const n = (pdf && (pdf as any).numPages) || 0;
    setNumPages(n);
    // Reset scroll to top on new doc
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // ResizeObserver: update baseWidth when container width changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // keep a sensible minimum and maximum so pages remain readable
      const MIN_BASE = 360;
      const MAX_BASE = 1600;
      const computed = Math.max(
        MIN_BASE,
        Math.min(MAX_BASE, Math.floor(rect.width - 32)),
      );
      setBaseWidth(computed);
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ctrl/Cmd + wheel zoom support (prevents default browser zoom when Ctrl is held).
  // Use a normalized, bounded delta and apply a small multiplicative factor so each
  // wheel event produces a consistent, fine-grained zoom step.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      // only zoom when ctrlKey or metaKey is pressed
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      // Normalize deltaY so very large delta values (some devices) don't jump too far.
      const raw = -e.deltaY; // invert so wheel up => positive
      const CLAMP = 60; // clamp large deltas
      const normalized = Math.max(-CLAMP, Math.min(CLAMP, raw)) / CLAMP; // -1..1

      // Maximum per-event step as fraction (e.g. 0.03 = ±3% per event)
      const MAX_STEP = 0.03;
      const factor = 1 + normalized * MAX_STEP;

      // Apply multiplicative change via functional update to avoid stale closures.
      setZoom((z) => {
        const next = Math.max(
          minZoom,
          Math.min(maxZoom, +(z * factor).toFixed(4)),
        );
        return next;
      });
    };

    el.addEventListener("wheel", handler as EventListener, { passive: false });
    return () => el.removeEventListener("wheel", handler as EventListener);
  }, [minZoom, maxZoom]);

  // small inline CSS to hide text/annotation layers from pdf.js / react-pdf.
  // This avoids duplicated text rendering beneath the canvas.
  const inlineStyle = `
    .react-pdf__Page__textContent,
    .react-pdf__Page__annotations,
    .textLayer,
    .annotationLayer,
    .rp__TextLayer,
    .rp__AnnotationLayer { display: none !important; visibility: hidden !important; pointer-events: none !important; }
    .react-pdf__Page__canvas canvas { background: white !important; display: block; margin: 0 auto; }
  `;

  // Controls handlers: use smaller multiplicative increments so button presses are consistent
  // and feel smooth (smaller jumps than before).
  const zoomIn = () =>
    setZoom((z) => Math.min(maxZoom, +(z * 1.02).toFixed(4)));
  const zoomOut = () =>
    setZoom((z) => Math.max(minZoom, +(z * 0.98).toFixed(4)));
  const fitWidth = () => {
    // recompute base width from container and reset zoom to 1
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const computed = Math.max(360, Math.floor(rect.width - 32));
    setBaseWidth(computed);
    setZoom(1);
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <style>{inlineStyle}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-2 py-1 rounded border bg-white text-sm"
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <div className="text-sm text-slate-700 w-14 text-center">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={zoomIn}
            className="px-2 py-1 rounded border bg-white text-sm"
            title="Zoom in"
            aria-label="Zoom in"
          >
            ＋
          </button>

          <button
            onClick={fitWidth}
            className="ml-2 px-2 py-1 rounded border bg-white text-sm"
            title="Fit width"
            aria-label="Fit width"
          >
            Fit
          </button>

          <div className="ml-3 text-xs text-slate-500">
            Tip: Hold Ctrl/Cmd and scroll to zoom
          </div>
        </div>

        <div>
          <a
            href={fileUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
            onClick={(e) => {
              if (!fileUrl) e.preventDefault();
            }}
          >
            Open in new tab
          </a>
        </div>
      </div>

      {/* Viewer container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto bg-slate-50"
      >
        {fileUrl ? (
          <div className="w-full h-full flex items-start justify-center p-3">
            <div className="w-full max-w-5xl flex flex-col items-center">
              <Document
                file={fileUrl}
                onLoadSuccess={onLoadSuccess}
                loading={
                  <div className="p-4 text-center text-slate-500">
                    Loading PDF…
                  </div>
                }
                noData={
                  <div className="p-4 text-center text-slate-500">
                    No PDF available
                  </div>
                }
              >
                <div style={{ width: "100%" }}>
                  {Array.from({ length: numPages }).map((_, i) => (
                    <div
                      key={i}
                      style={{ marginBottom: gap }}
                      className="w-full flex justify-center"
                    >
                      <Page
                        pageNumber={i + 1}
                        width={effectiveWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                          <div className="text-center p-2 text-slate-500">
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
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="text-center text-slate-500">
              No compiled PDF available
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
