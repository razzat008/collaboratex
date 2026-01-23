import React from "react";
import { Activity, MessageSquare } from "lucide-react";

interface FooterProps {
  showLogs: boolean;
  autoSave: boolean;
  hasUnsavedChanges: boolean;
  onToggleLogs: () => void;
}

const Footer: React.FC<FooterProps> = ({
  showLogs,
  autoSave,
  hasUnsavedChanges,
  onToggleLogs,
}) => {
  return (
    <div className="h-8 bg-slate-800 text-slate-400 text-xs flex items-center justify-between px-4">
      {/* Left: Status Information */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <span className="flex items-center gap-1">
          <Activity size={12} className="text-green-500" />
          Connected
        </span>

        {/* LaTeX Engine */}
        <span>LaTeX 2e (pdfTeX)</span>

        {/* Logs Toggle */}
        <button
          onClick={onToggleLogs}
          className={`hover:text-white transition-colors ${
            showLogs ? "text-blue-400" : ""
          }`}
        >
          View Logs
        </button>
      </div>

      {/* Right: Editor Information */}
      <div className="flex items-center gap-4">
        {/* Auto Save Status */}
        <span>{autoSave ? "💾 Auto-save: ON" : "📝 Auto-save: OFF"}</span>

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <span className="text-amber-500">● Unsaved Changes</span>
        )}

        {/* Encoding */}
        <span>UTF-8</span>

        {/* Chat Button */}
        <button className="hover:text-white transition-colors flex items-center gap-1">
          <MessageSquare size={12} />
          Chat
        </button>
      </div>
    </div>
  );
};

export default Footer;
