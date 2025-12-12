import EmptyDashBoard from "../components/DashBoard/EmptyProject";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardSkeleton() {
  return (
    <div className="h-screen w-screen flex">
      {/* ---- Sidebar ---- */}
      <aside className="w-80 border-r border-gray-300 bg-gray-200">
        {/* Creating New Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="m-4 w-60 rounded-4xl bg-teal-700">
              + Create New Project
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 mt-2">
            <DropdownMenuItem>Create a blank Project</DropdownMenuItem>
            <DropdownMenuItem>Import a project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
