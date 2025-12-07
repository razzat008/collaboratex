import { Search, FilePlus2, Settings, HelpCircle } from "lucide-react";
import { useSidebar } from "./SidebarContext";

const icons = [
  { id: "search", Icon: Search },
  { id: "files", Icon: FilePlus2 },
  { id: "settings", Icon: Settings },
  { id: "help", Icon: HelpCircle },
];

export default function SidebarIcons() {
  const { activePanel, setActivePanel } = useSidebar();

  return (
    <div className="w-12 bg-gray-100 border-r flex flex-col items-center py-4 gap-6">
      {icons.map(({ id, Icon }) => (
        <button
          key={id}
          onClick={() => setActivePanel(activePanel === id ? null : id)}
          className={`p-2 rounded-md transition ${
            activePanel === id ? "bg-gray-300" : "hover:bg-gray-200"
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
