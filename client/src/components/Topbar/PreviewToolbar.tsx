"use client";

import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export default function FormattingToolbar() {
  return (
    <>
      <header className="w-full h-12 bg-gray-200 flex items-center justify-between px-4">
        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Zoom group */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="outline" size="sm">
              −
            </Button>
            <div className="px-2">50%</div>
            <Button variant="outline" size="sm">
              +
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
