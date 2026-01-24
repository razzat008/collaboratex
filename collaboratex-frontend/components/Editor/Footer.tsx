import React from "react";
import { Activity, MessageSquare } from "lucide-react";

interface FooterProps {
  showLogs: boolean;
  autoSave: boolean;
  hasUnsavedChanges: boolean;
  onToggleLogs: () => void;
  onToggleChat: () => void;  
  isChatOpen: boolean;        
  hasUnreadChat: boolean;   
}

const Footer: React.FC<FooterProps> = ({
  showLogs,
  autoSave,
  hasUnsavedChanges,
  onToggleLogs,
  onToggleChat,      
  isChatOpen,        
  hasUnreadChat,
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
       <button 
          onClick={onToggleChat}
          className="hover:text-white transition-colors flex items-center gap-1 relative"
        >
          <MessageSquare size={12} />
          Chat
          {hasUnreadChat && !isChatOpen && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Footer;
