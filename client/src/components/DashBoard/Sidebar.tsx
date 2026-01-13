import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Sidebar() {
  return (
    <aside className="w-80 border-r border-gray-300 bg-gray-200 p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full rounded-full bg-white">+ Create New Project</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mt-2 w-full">
          <DropdownMenuItem>Create a blank Project</DropdownMenuItem>
          <DropdownMenuItem>Import a project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Add more sidebar content here if needed */}
    </aside>
  );
}
