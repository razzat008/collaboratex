import { createContext, useContext, useState } from "react";

type SidebarContextType = {
  activePanel: string | null;
  setActivePanel: (p: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ activePanel, setActivePanel }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("Sidebar must be inside SidebarProvider");
  return ctx;
}
