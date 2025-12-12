import EmptyDashBoard from "../components/DashBoard/EmptyProject";

export default function DashboardSkeleton() {
  return (
    <div className="h-screen w-screen flex">
      {/* ---- Sidebar ---- */}
      <aside className="w-60 border-r border-gray-300 bg-gray-200">
        {/* Sidebar content */}
      </aside>

      {/* ---- Main Area ---- */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* ---- Top Bar ---- */}
        <header className="h-14 border-b border-gray-300 bg-gray-200 px-4 flex items-center justify-between">
          {/* Left side */}
          <div>{/* Title / Breadcrumb */}</div>

          {/* Right side */}
          <div className="flex items-center gap-3 text-gray-600">
            {/* Search */}
            {/* View toggle buttons */}
            {/* Import */}
            {/* New */}
          </div>
        </header>

        {/* ---- Content Area ---- */}
        <main className="flex-1 overflow-auto p-6">
          <EmptyDashBoard />
        </main>
      </div>
    </div>
  );
}
