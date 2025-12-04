import React, { useState, useRef, useEffect } from "react";
import TopBar from "./components/TopBar/TopBar";
import FileTreePane from "./components/FileTreePane/FileTreePane";
import EditorPane from "./components/EditorPane/EditorPane";
import PDFPreviewPane from "./components/PDFPreviewPane/PDFPreviewPane";
import BottomBar from "./components/BottomBar/BottomBar";
import "./styles/global.css";

const SIDEBAR_MODES = [
  { key: "files", label: "Files", icon: "📁" },
  { key: "diagnostics", label: "Diagnostics", icon: "🩺" },
  { key: "find", label: "Find & Replace", icon: "🔍" },
];

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<
    null | "files" | "diagnostics" | "find"
  >(null);
  const [openedFile, setOpenedFile] = useState<string>("main.tex");
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        (event.target as HTMLElement).getAttribute("data-sidebar-icon") !==
          "true"
      ) {
        setSidebarOpen(null);
      }
    }
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  function renderSidebarContent() {
    switch (sidebarOpen) {
      case "files":
        // Pass setOpenedFile to FileTreePane for dynamic file opening
        return <FileTreePane onOpenFile={setOpenedFile} />;
      case "diagnostics":
        return (
          <div style={{ padding: "1em" }}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "1em",
                color: "var(--primary, #4B9CD3)",
              }}
            >
              Diagnostics
            </h3>
            <div style={{ color: "#888" }}>
              {/* Stub diagnostics for now */}
              No errors or warnings.
            </div>
          </div>
        );
      case "find":
        return (
          <div style={{ padding: "1em" }}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "1em",
                color: "var(--primary, #4B9CD3)",
              }}
            >
              Find &amp; Replace
            </h3>
            <input
              type="text"
              placeholder="Find..."
              style={{
                width: "100%",
                marginBottom: "0.5em",
                padding: "0.5em",
                borderRadius: 4,
                border: "1px solid var(--border-color)",
              }}
            />
            <input
              type="text"
              placeholder="Replace..."
              style={{
                width: "100%",
                marginBottom: "0.5em",
                padding: "0.5em",
                borderRadius: 4,
                border: "1px solid var(--border-color)",
              }}
            />
            <button
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Find &amp; Replace
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="app-container">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--topbar-bg)",
          }}
        >
          <TopBar />
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            position: "relative",
            minHeight: 0,
          }}
        >
          {/* Permanent vertical bar */}
          <div
            style={{
              width: "48px",
              background: "var(--sidebar-bg)",
              borderRight: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: "12px",
              position: "relative",
              zIndex: 3,
              boxSizing: "border-box",
              height: "100%",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: "32px",
                height: "32px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.5em",
                color: "var(--primary)",
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                userSelect: "none",
              }}
              title="Logo"
            >
              L
            </div>
            {/* Sidebar icons */}
            {SIDEBAR_MODES.map((mode) => (
              <button
                key={mode.key}
                data-sidebar-icon="true"
                style={{
                  width: "32px",
                  height: "32px",
                  marginBottom: "16px",
                  border: "none",
                  background:
                    sidebarOpen === mode.key ? "var(--primary)" : "transparent",
                  color: sidebarOpen === mode.key ? "#fff" : "#333",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1.3em",
                  boxShadow:
                    sidebarOpen === mode.key
                      ? "0 2px 8px rgba(0,0,0,0.08)"
                      : "none",
                  transition: "background 0.2s",
                  outline: "none",
                }}
                onClick={() =>
                  setSidebarOpen((prev) =>
                    prev === mode.key ? null : (mode.key as any),
                  )
                }
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>
          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div
              ref={sidebarRef}
              style={{
                position: "absolute",
                left: "48px",
                top: 0,
                bottom: 0,
                width: "260px",
                background: "var(--sidebar-bg)",
                borderRight: "1px solid var(--border-color)",
                boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                maxHeight: "100vh",
                transition: "left 0.2s",
              }}
            >
              <div style={{ flex: 1, overflowY: "auto" }}>
                {renderSidebarContent()}
              </div>
            </div>
          )}
          {/* Editor and PDF preview with custom horizontal resizer */}
          <div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 0,
              position: "relative",
              width: "100%",
              overflow: "hidden",
              transition: "margin-left 0.2s",
              marginLeft: sidebarOpen ? "260px" : "0",
            }}
          >
            {/* Editor Pane */}
            <div
              className="editor-pane"
              style={{
                minWidth: "250px",
                width: "50%",
                maxWidth: "80vw",
                borderRight: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                minHeight: 0,
                transition: "width 0.1s",
              }}
              id="editor-pane"
            >
              <EditorPane openedFile={openedFile} />
            </div>
            {/* Resizer */}
            <div
              id="horizontal-resizer"
              style={{
                width: "6px",
                cursor: "col-resize",
                background: "#eee",
                zIndex: 2,
                position: "relative",
              }}
              onMouseDown={(e) => {
                const editorPane = document.getElementById("editor-pane");
                const startX = e.clientX;
                const startWidth = editorPane ? editorPane.offsetWidth : 0;
                function onMouseMove(ev: MouseEvent) {
                  if (editorPane) {
                    const newWidth = Math.max(
                      250,
                      Math.min(
                        window.innerWidth - 250,
                        startWidth + (ev.clientX - startX),
                      ),
                    );
                    editorPane.style.width = newWidth + "px";
                  }
                }
                function onMouseUp() {
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                }
                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
            />
            {/* PDF Preview Pane */}
            <div
              className="pdf-preview-pane"
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <PDFPreviewPane />
            </div>
          </div>
        </div>
        <BottomBar />
      </div>
    </div>
  );
};

export default App;
