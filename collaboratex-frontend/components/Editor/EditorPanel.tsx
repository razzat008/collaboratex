// ============================================================================
// EditorPanel.tsx
// ============================================================================
import React from "react";
import { FileText, Eye, EyeOff } from "lucide-react";

interface EditorPanelProps {
  currentFile: { id: string; name: string; content: string } | null;
  isPdfVisible: boolean;
  splitRatio: number;
  onEditorReady: (fn: () => string) => void;
  onContentChange: (value: string) => void;
  onTogglePdf: () => void;
  children: React.ReactNode;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  currentFile,
  isPdfVisible,
  splitRatio,
  onTogglePdf,
  children,
}) => {
  return (
    <div
      className="flex flex-col bg-white border-r border-slate-200 transition-all duration-150"
      style={{
        width:
          isPdfVisible ? `${splitRatio}%` : "100%",
      }}
    >
      {/* Header */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {currentFile?.name || "No file selected"}
          </span>
        </div>
        <button
          onClick={onTogglePdf}
          className="p-1 rounded transition-colors text-slate-400 hover:text-slate-600"
        >
          {isPdfVisible ? (
            <Eye size={16} />
          ) : (
            <EyeOff size={16} />
          )}
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default EditorPanel;

// ============================================================================
// PDFPanel.tsx
// ============================================================================
