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
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
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
      <header className="w-full h-12 bg-gray-200 flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-start"></div>
        <Menubar className="w-auto bg-transparent underline">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
        {/* Center */}
        <div className="text-sm text-muted-foreground">
          Gollaboratex Playground
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Need to add more component */}
        </div>
      </header>
    </>
  );
}
