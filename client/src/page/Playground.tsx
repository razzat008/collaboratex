import { SidebarProvider } from "../components/Preview/SidebarPlayground/SidebarContext";
import SidebarIcons from "../components/Preview/SidebarPlayground/SidebarIcons";
import SidebarPanel from "../components/Preview/SidebarPlayground/SidebarPanel";
import SplitView from "../components/Splitview/Splitview";
import TopBar from "../components/Topbar/Topbar";

export default function Playground() {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen overflow-clip">
        {/* Full width top bar */}
        <TopBar />
        {/*// formatting toolbar lies in splitview*/}
        {/* Layout area below top bar */}
        <div className="flex flex-1">
          <SidebarIcons />
          <SidebarPanel />
          <SplitView />
        </div>
      </div>
    </SidebarProvider>
  );
}
