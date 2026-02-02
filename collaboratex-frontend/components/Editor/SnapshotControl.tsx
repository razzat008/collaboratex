import React, { useEffect, useRef, useState } from "react";
import { Flag, ChevronDown } from "lucide-react";

type Version = {
  id: string;
  createdAt: string; // ISO string
  message?: string | null;
};

type Props = {
  versions?: Version[]; // list most-recent-first is preferred
  onCreate: (message?: string) => Promise<void> | void;
  onRestore: (id: string) => Promise<void> | void;
  // Optional UI tweaks
  maxWidthClass?: string; // Tailwind width class, e.g. "w-80"
  showCount?: boolean;
  // when >0 the dropdown will close after this delay (ms) on mouse leave to avoid flicker
  closeDelayMs?: number;
};

/**
 * SnapshotControl
 *
 * - Clicking the flag (🚩) opens a small message input popup to label the snapshot, then calls `onCreate(message)`.
 * - Clicking the "v" toggles the versions dropdown. The dropdown only opens/closes via clicks (not hover).
 * - The dropdown will hide when the mouse leaves the dropdown area (with a small delay to avoid flicker).
 * - Each version entry shows its created time and optional message and has a Restore button which calls `onRestore(id)`.
 *
 * This is a presentational component — it does not talk to GraphQL directly.
 * The parent should pass `versions`, `onCreate`, and `onRestore`.
 */
export default function SnapshotControl({
  versions = [],
  onCreate,
  onRestore,
  maxWidthClass = "w-80",
  showCount = true,
  closeDelayMs = 150,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  // Close dropdown on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowMessageInput(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside to close (useful when dropdown is open)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (open && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Focus the message input when it opens
  useEffect(() => {
    if (showMessageInput) {
      const t = window.setTimeout(() => messageInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return;
  }, [showMessageInput]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateClick = () => {
    // Show the message input (user may leave it empty)
    setMessage("");
    setShowMessageInput(true);
    // Ensure dropdown is closed when creating a snapshot (UX choice)
    setOpen(false);
  };

  const submitCreate = async () => {
    try {
      setIsCreating(true);
      await onCreate(message.trim() === "" ? undefined : message.trim());
      // reset UI
      setMessage("");
      setShowMessageInput(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    await onRestore(id);
    setOpen(false);
  };

  const handleMouseLeave = () => {
    if (closeDelayMs && closeDelayMs > 0) {
      closeTimeoutRef.current = window.setTimeout(
        () => setOpen(false),
        closeDelayMs,
      );
    } else {
      setOpen(false);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  return (
    <div className="relative inline-block">
      {/* Snapshot composite button: flag (create) + chevron (toggle) styled like Save button */}
      <div className="flex items-center gap-2 px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
        <button
          type="button"
          onClick={handleCreateClick}
          title="Save snapshot"
          className="flex items-center gap-2"
        >
          <span className="sr-only">Save snapshot</span>
          <Flag size={16} />    |
        </button>

        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
          aria-haspopup="true"
          title="Show versions"
          className="flex items-center px-1"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          className={`absolute z-50 mt-2 ${maxWidthClass} left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded`}
          role="menu"
          aria-label="Snapshots"
        >
          <div className="p-2 text-sm text-gray-600 border-b flex items-center justify-between">
            <div>
              {showCount ? `Snapshots (${versions.length})` : "Snapshots"}
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            {versions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No snapshots yet</div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                >
                  <div className="text-left min-w-0">
                    <div className="text-xs text-gray-700">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                    {v.message && (
                      <div className="text-xs text-gray-500 truncate">
                        {v.message}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Message input popup for creating a snapshot */}
      {showMessageInput && (
        <div
          className="absolute z-50 mt-2 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded p-3 w-80"
          role="dialog"
          aria-modal="true"
        >
          <div className="text-sm font-medium text-gray-800 mb-2">
            Save snapshot
          </div>

          <label className="block text-xs text-gray-600 mb-1">
            Message (optional)
          </label>
          <input
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-2 py-1 border rounded mb-3 text-sm"
            placeholder="Describe this snapshot (optional)"
            aria-label="Snapshot message"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // submit on Enter
                e.preventDefault();
                submitCreate();
              } else if (e.key === "Escape") {
                setShowMessageInput(false);
              }
            }}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setShowMessageInput(false);
              }}
              className="px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={isCreating}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-60"
            >
              {isCreating ? "Saving..." : "Save snapshot"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
