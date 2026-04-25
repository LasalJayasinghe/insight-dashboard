import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar open={open} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleSidebar={() => setOpen((o) => !o)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
