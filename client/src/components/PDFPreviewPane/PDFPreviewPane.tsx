import React from "react";

const PDFPreviewPane: React.FC = () => {
  return (
    <div
      className="pdf-preview-pane-content"
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--preview-bg, #fff)",
      }}
    >
      {/* Placeholder for PDF preview */}
      <div style={{ color: "#888", fontSize: "1.2rem", textAlign: "center" }}>
        PDF Preview will appear here.
        <br />
        (Compile your LaTeX to see the output)
      </div>
    </div>
  );
};

export default PDFPreviewPane;
