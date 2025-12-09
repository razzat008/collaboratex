//
// export default function TopBar() {
//   return (
//     <div className="h-12 border-b flex items-center px-4 gap-4 bg-white">
//       <span className="font-semibold">Typst Playground</span>
//     </div>
//   );
// }
//
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function Topbar() {
  return (
    <>
      <header className="w-full h-12 bg-muted/30 flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <span
            className="text-2xl font-bold text-teal-400"
            aria-label="Gollaboratex logo"
          >
            G
          </span>

          {/* Menu list */}
          <nav className="flex items-center gap-4 text-sm font-medium">
            <button className="hover:underline">Gollaboratex</button>
            <button className="hover:underline">File</button>
            <button className="hover:underline">Edit</button>
            <button className="hover:underline">View</button>
            <button className="hover:underline">Help</button>
          </nav>
        </div>

        {/* Center */}
        <div className="text-sm text-muted-foreground">
          Gollaboratex Playground
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Undo */}
          <Button variant="outline" size="icon">
            ↩️
          </Button>

          {/* Zoom group */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm">
              −
            </Button>
            <div className="px-2">84%</div>
            <Button variant="ghost" size="sm">
              ＋
            </Button>
          </div>

          {/* Share */}
          <Button>Share</Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">⤓</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export PDF</DropdownMenuItem>
              <DropdownMenuItem>Export Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
