import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

/**
 * Editorial index-rail navigation.
 * Reads like the contents page of a printed report: numbered entries,
 * hairline rules, ink-filled active row. No pills, no glow.
 */
const navGroups = [
  {
    group: "Markets",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/stocks", label: "Stocks Market" },
      { to: "/watchlist", label: "Watchlist" },
      { to: "/alerts", label: "Price Alerts" },
    ],
  },
  {
    group: "Automation",
    items: [
      { to: "/algorithms", label: "AI Strategies" },
      { to: "/crypto", label: "Crypto Market" },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/portfolios", label: "Portfolios" },
      { to: "/profile", label: "User Profile" },
      { to: "/settings", label: "Preferences" },
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

  let counter = 0;

  const navContent = (
    <div className="flex h-full flex-col border-r border-hairline bg-sidebar">
      {/* Masthead */}
      <div className="flex h-16 shrink-0 items-center border-b border-hairline px-4">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center bg-primary font-display text-sm font-bold text-primary-foreground">
            A
          </div>
          {open && (
            <div className="min-w-0 leading-none">
              <div className="font-display text-[15px] font-bold tracking-tight text-sidebar-foreground">
                AlertMe
              </div>
              <div className="label-caps mt-1">Trading Desk</div>
            </div>
          )}
        </Link>
      </div>

      {/* Index */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto py-3">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {open && <div className="label-caps px-4 pb-2">{group.group}</div>}
            <div className="border-t border-hairline/70">
              {group.items.map(({ to, label }) => {
                counter += 1;
                const num = String(counter).padStart(2, "0");
                const active =
                  location.pathname === to || (to === "/dashboard" && location.pathname === "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center gap-3 border-b border-hairline/70 px-4 py-2.5 text-[13px] transition-colors",
                      active
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                    title={label}
                  >
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] tabular-nums",
                        active ? "opacity-70" : "text-muted-foreground",
                      )}
                    >
                      {num}
                    </span>
                    {open && <span className="truncate">{label}</span>}
                    {open && active && <span className="ml-auto text-[10px]">→</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-hairline p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full cursor-pointer items-center gap-3 px-1 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          {open && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "z-30 hidden h-screen shrink-0 select-none transition-all duration-300 md:block",
          open ? "w-56" : "w-[68px]",
        )}
      >
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-foreground/40" onClick={onCloseMobile} />
          <div className="animate-in slide-in-from-left relative z-10 h-full w-60 duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
