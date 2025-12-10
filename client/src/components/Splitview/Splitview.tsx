import React, { useState } from "react";
import EditorPane from "../Editor/Editor";
import PreviewPane from "../Preview/PreviewPane";
import FormattingToolbar from "../Topbar/FormattingToolbar";
import PreviewToolbar from "../Topbar/PreviewToolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function SplitView() {
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  return (
    <div className="flex flex-1 h-full">
      <ResizablePanelGroup direction="horizontal" handle={<ResizableHandle />}>
        {/* LEFT PANEL (Editor) */}
        <ResizablePanel
          minSize={20}
          defaultSize={50}
          collapsedSize={0}
          collapsible
          onResize={(size) => {
            // If dragged fully left → collapse editor
            if (size <= 1) setEditorCollapsed(true);
            else setEditorCollapsed(false);
          }}
        >
          <div className="bg-white h-full">
            {!editorCollapsed && <FormattingToolbar />}{" "}
            {/*  <- Hide when collapsed */}
            <EditorPane />
          </div>
        </ResizablePanel>

        {/*<ResizableHandle withHandle />*/}
        <ResizableHandle withHandle className="w-3 bg-gray-200" />

        {/* RIGHT PANEL (Preview) */}
        <ResizablePanel
          minSize={20}
          defaultSize={50}
          collapsedSize={0}
          collapsible
          onResize={(size) => {
            // If dragged fully right → collapse preview
            if (size <= 1) setPreviewCollapsed(true);
            else setPreviewCollapsed(false);
          }}
        >
          <div className="bg-white h-full">
            {!previewCollapsed && <PreviewToolbar />} <PreviewPane />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
