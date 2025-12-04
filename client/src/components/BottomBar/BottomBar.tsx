import React from "react";

const BottomBar: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "32px",
        background: "var(--bottom-bar-bg, #222)",
        color: "var(--bottom-bar-text, #fff)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: "14px",
        boxSizing: "border-box",
        borderTop: "1px solid #444",
      }}
    >
      Status: Ready &mdash; No errors
    </div>
  );
};

export default BottomBar;
