// export default function Sidebar() {
//   return (
//     <div className="bg-gray-100 w-12 border-r">
//       {/* Sidebar Icons will go here */}
//     </div>
//   );
// }
//
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
} from "@/components/ui/sidebar";

import { File, Save, Search, Settings, HelpCircle } from "lucide-react";

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        {/* This is optional branding area */}
      </SidebarHeader>

      <SidebarContent>
        {/* First grouping — your icons */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
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

      <SidebarFooter>
        {/* anything you want at bottom */}
      </SidebarFooter>
    </Sidebar>
  );
}
