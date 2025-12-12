import { useSidebar } from "./SidebarContext";
import SearchPanel from "./panels/SearchPanel";

const panels: Record<string, React.ReactNode> = {
  search: <SearchPanel />,
  // add others
};

export default function SidebarPanel() {
  const { activePanel } = useSidebar();

  if (!activePanel) return null;

  return (
    <div className="w-64  border-r-12  bg-white h-full p-4">
      {panels[activePanel]}
    </div>
  );
}
