import { useState, useEffect, useRef } from "react";
import { Bell, Menu, Moon, Search, Sun, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/hooks/use-theme";
import { logout } from "@/lib/auth";
import { watchlistService, type StockOption } from "@/services/watchlist-service";
import { stockService, type IntradayPoint } from "@/services/stock-service";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onToggleSidebar: () => void;
}

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative grid size-9 cursor-pointer place-items-center border border-hairline bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [intradayMap, setIntradayMap] = useState<Record<string, IntradayPoint>>({});
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStockData = async () => {
      setLoading(true);
      try {
        const [options, intradayData] = await Promise.all([
          watchlistService.listStockOptions().catch(() => []),
          stockService.getIntraday().catch(() => []),
        ]);

        if (cancelled) return;

        setStocks(options);

        const map: Record<string, IntradayPoint> = {};
        for (const item of intradayData) {
          map[item.symbol.toUpperCase()] = item;
        }
        setIntradayMap(map);
      } catch {
        // Fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStockData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Colombo",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks = stocks
    .filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return false;
      return s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
    })
    .slice(0, 8);

  const handleSelectStock = (symbol: string) => {
    setIsOpen(false);
    setSearch("");
    void navigate({ to: "/stocks", search: { symbol } });
  };

  const handleSignOut = async () => {
    logout();
    await navigate({ to: "/login" });
  };

  const userName =
    typeof window !== "undefined"
      ? `${localStorage.getItem("firstName") || "User"} ${localStorage.getItem("lastName") || ""}`.trim()
      : "User";

  const userInitials =
    typeof window !== "undefined"
      ? `${(localStorage.getItem("firstName") || "A")[0]}${(localStorage.getItem("lastName") || "M")[0]}`.toUpperCase()
      : "AM";

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-hairline bg-background/90 backdrop-blur-md">
      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton label="Toggle navigation" onClick={onToggleSidebar}>
            <Menu className="size-4" />
          </IconButton>
          <div className="hidden lg:block">
            <div className="label-caps">Colombo · CSE</div>
            <div className="font-mono text-xs tabular-nums">{clock}</div>
          </div>
        </div>

        {/* Search */}
        <div ref={searchContainerRef} className="relative mx-auto hidden w-full max-w-xl sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsOpen(false);
              }}
              placeholder="Search a symbol — COMBANK, JKH, LOLC…"
              className="w-full border border-hairline bg-card py-2.5 pr-9 pl-9 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setIsOpen(false);
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {isOpen && search.trim().length > 0 && (
            <div className="animate-in fade-in-0 absolute inset-x-0 top-full z-50 mt-1 border border-hairline bg-popover shadow-card duration-150">
              <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                <span className="label-caps">Results</span>
                <span className="label-caps opacity-60">Enter to view</span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="animate-pulse p-4 text-center text-xs text-muted-foreground">
                    Loading symbols…
                  </div>
                ) : filteredStocks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nothing matches “{search}”
                  </div>
                ) : (
                  filteredStocks.map((s) => {
                    const intraday = intradayMap[s.symbol.toUpperCase()];
                    const price = intraday?.price;
                    const changePct = intraday?.percentage;
                    const isUp = changePct !== undefined && changePct >= 0;

                    return (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => handleSelectStock(s.symbol)}
                        className="group flex w-full items-center justify-between gap-3 border-b border-hairline/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-secondary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-24 shrink-0 truncate font-mono text-xs font-semibold">
                            {s.symbol}
                          </span>
                          <span className="min-w-0 truncate text-xs text-muted-foreground">
                            {s.name}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {price !== undefined && (
                            <span className="font-mono text-xs tabular-nums">{formatRs(price)}</span>
                          )}
                          {changePct !== undefined && (
                            <span
                              className={cn(
                                "font-mono text-xs tabular-nums",
                                isUp ? "text-success" : "text-destructive",
                              )}
                            >
                              {isUp ? "+" : ""}
                              {changePct.toFixed(2)}%
                            </span>
                          )}
                          <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <IconButton label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>

          <IconButton label="Notifications">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />
          </IconButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 border border-hairline bg-card py-1 pr-3 pl-1 transition-colors hover:bg-secondary"
              >
                <Avatar className="size-7 rounded-none">
                  <AvatarFallback className="rounded-none bg-primary font-mono text-[11px] font-semibold text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-xs font-medium md:inline">
                  {userName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-hairline p-0">
              <DropdownMenuLabel className="label-caps px-3 py-2.5">Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-none px-3 py-2.5 text-xs">
                <Link to="/profile">Profile details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-none px-3 py-2.5 text-xs">
                <Link to="/settings">Settings & preferences</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem
                className="cursor-pointer rounded-none px-3 py-2.5 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={handleSignOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
