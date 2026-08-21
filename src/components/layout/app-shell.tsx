import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background">
      {/* Sidebar (Independent fixed container) */}
      <Sidebar open={open} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area (Independent scrollable view) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar
          onToggleSidebar={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setMobileOpen((m) => !m);
            } else {
              setOpen((o) => !o);
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">{children}</main>
      </div>

      <AssistantWidget />
    </div>
  );
}
