import React from "react";
import Topbar from "@/components/DashBoard/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar can also be a component if needed */}
      <aside className="w-80 border-r border-gray-300 bg-gray-200">
        {/* Put sidebar content here */}
      </aside>

      <div className="flex-1 flex flex-col bg-gray-50">
        <Topbar /> {/* Your custom topbar for logged-in users */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
