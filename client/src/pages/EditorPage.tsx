import { useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import Editor from "../components/Editor/Editor";

export default function EditorPage() {
  const [code, setCode] = useState("");

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <PanelGroup direction="horizontal">
        
        {/* LEFT PANEL → EDITOR */}
        <Panel defaultSize={60} minSize={30}>
          <Editor value={code} onChange={setCode} />
        </Panel>

        {/* HANDLE */}
        <PanelResizeHandle
          style={{ width: "6px", background: "#ccc", cursor: "col-resize" }}
        />

        {/* RIGHT PANEL → PDF */}
        <Panel minSize={20}>
        </Panel>

      </PanelGroup>
    </div>
  );
}
