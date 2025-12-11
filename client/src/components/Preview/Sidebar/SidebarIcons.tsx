import React from "react";
import { Search, File, Settings, HelpCircle } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

/**
 * Minimal Sidebar icons component.
 * - Uses the existing SidebarContext for active panel state.
 * - Very small, easy-to-read markup and styles (Tailwind).
 * - Logo at top (simple "G" placeholder) and a few action icons below.
 */

const ICONS: { id: string; Icon: React.ComponentType<any>; label: string }[] = [
  { id: "search", Icon: Search, label: "Search" },
  { id: "files", Icon: File, label: "Files" },
  { id: "settings", Icon: Settings, label: "Settings" },
  { id: "help", Icon: HelpCircle, label: "Help" },
];

export default function SidebarIcons() {
  const { activePanel, setActivePanel } = useSidebar();

  return (
    <aside className="w-16 bg-gray-200 border-r flex flex-col items-center py-1 gap-3">
      {/* Simple logo button */}
      <button
        type="button"
        onClick={() => setActivePanel(null)}
        aria-label="Home"
        title="Home"
        className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-teal-500 text-4xl font-bold"
      >
        G
      </button>

      {/* Icon buttons */}
      <nav className="flex flex-col gap-2 mt-2">
        {ICONS.map(({ id, Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivePanel(isActive ? null : id)}
                  aria-pressed={isActive}
                  // title={label}
                  className={`p-2 rounded-md transition-colors ${
                    isActive ? "bg-gray-300" : "hover:bg-gray-300"
                  }`}
                >
                  <Icon className="w-6 h-6 text-gray-700" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
