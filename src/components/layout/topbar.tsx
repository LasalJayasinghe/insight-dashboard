import { useState, useEffect, useRef } from "react";
import { Bell, Menu, Moon, Search, Sun, TrendingUp, TrendingDown, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { stocksService, type IntradayPoint } from "@/services/stocks-service";
import { formatRs } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [intradayMap, setIntradayMap] = useState<Record<string, IntradayPoint>>({});
  const [loading, setLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load stocks list for search autocomplete
  useEffect(() => {
    let cancelled = false;

    const loadStockData = async () => {
      setLoading(true);
      try {
        const [options, intradayData] = await Promise.all([
          watchlistService.listStockOptions().catch(() => []),
          stocksService.getIntraday().catch(() => []),
        ]);

        if (cancelled) return;

        setStocks(options);

        // Build quick lookup map for intraday prices
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

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks = stocks.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return false;
    return s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
  }).slice(0, 8);

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
    <header className="h-16 border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-30 transition-colors">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
          >
            <Menu className="size-5" />
          </Button>
        </div>

        {/* Center: Live Stock Search Autocomplete Bar */}
        <div ref={searchContainerRef} className="relative max-w-md w-full hidden sm:block">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              placeholder="Search CSE stock symbol or name (e.g. COMBANK)..."
              className="w-full pl-10 pr-10 py-2 bg-muted/40 hover:bg-muted/60 border border-border/60 focus:border-primary/60 rounded-xl text-xs font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/60 shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setIsOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown List */}
          {isOpen && search.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-border/40 text-[10px] uppercase font-mono font-bold text-muted-foreground flex items-center justify-between">
                <span>Matching Stock Results</span>
                <span>Click to View Chart</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/20 p-1">
                {loading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                    Loading stock symbols...
                  </div>
                ) : filteredStocks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No stocks matching "{search}"
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
                        className="w-full p-2.5 flex items-center justify-between rounded-lg hover:bg-muted/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono shrink-0">
                            {s.symbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold font-mono text-foreground group-hover:text-primary transition-colors truncate">
                              {s.symbol}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{s.name}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {price !== undefined && (
                            <div className="text-right">
                              <div className="text-xs font-mono font-bold text-foreground">{formatRs(price)}</div>
                              {changePct !== undefined && (
                                <div
                                  className={cn(
                                    "text-[10px] font-mono font-bold flex items-center justify-end gap-0.5",
                                    isUp ? "text-emerald-400" : "text-red-400",
                                  )}
                                >
                                  {isUp ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                                  <span>{isUp ? "+" : ""}{changePct.toFixed(2)}%</span>
                                </div>
                              )}
                            </div>
                          )}
                          <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle, Notifications, Account Dropdown */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="size-4.5 text-amber-400" /> : <Moon className="size-4.5 text-slate-700" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-4.5" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-400 ring-2 ring-card animate-pulse" />
          </Button>

          {/* Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-muted/60 border border-border/40 transition cursor-pointer"
              >
                <Avatar className="size-7 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold font-mono">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {userName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border-border">
              <DropdownMenuLabel className="text-xs font-mono font-bold text-muted-foreground uppercase px-2 py-1.5">
                Account Overview
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <Link to="/profile" className="flex items-center gap-2 text-xs font-medium">
                  Profile Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                <Link to="/settings" className="flex items-center gap-2 text-xs font-medium">
                  Settings & Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer text-xs font-medium"
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
