import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, User, LineChart, Settings, Bell, LogOut, Cpu, Bitcoin, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

const navGroups = [
  {
    group: "MARKETS & TRADING",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/stocks", label: "Stocks Market", icon: BarChart3 },
      { to: "/watchlist", label: "Watchlist", icon: LineChart },
      { to: "/alerts", label: "Price Alerts", icon: Bell },
    ],
  },
  {
    group: "ALGORITHMS & CRYPTO",
    items: [
      { to: "/algorithms", label: "AI Strategies", icon: Cpu },
      { to: "/crypto", label: "Crypto Market", icon: Bitcoin },
    ],
  },
  {
    group: "SETTINGS & PROFILE",
    items: [
      { to: "/profile", label: "User Profile", icon: User },
      { to: "/settings", label: "Preferences", icon: Settings },
    ],
  },
] as const;

interface SidebarProps {
  open: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ open, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    logout();
    await navigate({ to: "/login" });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/60 transition-colors">
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border/60 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="size-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp className="size-5 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold font-mono tracking-tight text-sidebar-foreground">
                AlertMe
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">
                Trading Platform
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Links Grouped by Category */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {open && (
              <div className="px-3 pb-1 text-[10px] font-extrabold font-mono uppercase tracking-widest text-muted-foreground/60 select-none">
                {group.group}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to === "/dashboard" && location.pathname === "/");
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 group relative",
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <Icon className={cn("size-4.5 shrink-0 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground")} />
                  {open && <span className="truncate">{label}</span>}
                  {open && active && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-sidebar-border/60 shrink-0">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="size-4.5 shrink-0 text-muted-foreground hover:text-destructive" />
          {open && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Independent Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-screen shrink-0 transition-all duration-300 z-30 select-none",
          open ? "w-60" : "w-[72px]",
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer (Independent Overlay) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-64 h-full z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
