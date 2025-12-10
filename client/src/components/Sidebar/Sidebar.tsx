// export default function Sidebar() {
//   return (
//     <div className="bg-gray-100 w-12 border-r">
//       {/* Sidebar Icons will go here */}
//     </div>
//   );
// }
//
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "../ui/sidebar";

import { File, Save, Search, Settings } from "lucide-react";

export default function AppSidebar() {
  return (
    <Sidebar className="border-r">
      {/* Optional top branding area */}
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* Logo */}
              <SidebarMenuItem>
                <SidebarMenuButton className="justify-center h-12">
                  <span className="text-4xl font-extrabold text-teal-400">
                    G
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Menu Items */}
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <File className="w-4 h-4" />
                  New File
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Save className="w-4 h-4" />
                  Save
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Search className="w-4 h-4" />
                  Search
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="w-4 h-4" />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <HelpCircle className="w-4 h-4" />
                  Help
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
