import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, User, LineChart, Settings, Bell, LogOut, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/algorithms", label: "Algorithms", icon: Cpu },
  { to: "/watchlist", label: "Watchlist", icon: LineChart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ open }: { open: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    logout();
    await navigate({ to: "/login" });
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
        open ? "w-60" : "w-[72px]",
      )}
    >
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="size-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <img src="/public/logo/logo.png" alt="Logo" className="size-5" />
        </div>
        {open && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">AlertMe</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Trading</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all group",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className={cn("size-5 shrink-0", active && "text-primary")} />
              {open && <span className="font-medium">{label}</span>}
              {open && active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/60 transition-colors"
        >
          <LogOut className="size-5 shrink-0" />
          {open && <span className="font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
