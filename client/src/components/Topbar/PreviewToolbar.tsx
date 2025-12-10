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
      <header className="w-full h-10 bg-gray-200 flex items-center justify-between px-4">
        {/* LEFT SIDE — Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="outline" size="sm">
              −
            </Button>
            <div className="px-2">50%</div>
            <Button variant="outline" size="sm">
              +
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE — Compile + Export */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            compile
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                ⤓
              </Button>
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
