// import Sidebar from "../components/Sidebar/Sidebar";
// import TopBar from "../components/Topbar/Topbar";
// import SplitView from "../components/Splitview/Splitview";
//
// export default function Playground() {
// 	return (
// 		<div className="flex h-screen w-screen">
// 		{/* Toolbar */}
// 		<TopBar />
// 		{/* Full Workspace Area */}
// 		<div className="flex flex-col flex-1">
// 			{/* Left sidebar */}
// 			<Sidebar />
//
// 		{/* Editor + Preview */}
// 		<SplitView />
// 		</div>
// 		</div>
// 	);
// }
//
import { SidebarProvider } from "../components/Sidebar/SidebarContext";
import SidebarIcons from "../components/Sidebar/SidebarIcons";
import SidebarPanel from "../components/Sidebar/SidebarPanel";
import SplitView from "../components/Splitview/Splitview";
import TopBar from "../components/Topbar/Topbar";

export default function Playground() {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-screen">

        {/* Full width top bar */}
        <TopBar />

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
