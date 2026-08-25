import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/use-theme";
import { isAuthenticated } from "@/lib/auth";
import { settingsService, type UserSettings } from "@/services/settings-service";
import { newsService, type NewsStatus } from "@/services/news-service";
import { Cpu, RefreshCw, Sparkles, CheckCircle2, Clock, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Settings — AlertMe Trading" },
      { name: "description", content: "Configure your trading dashboard preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);

  const [usdtRate, setUsdtRate] = useState("");
  const [lkrRate, setLkrRate] = useState("");

  // AI News Scanning Poll State
  const [newsStatus, setNewsStatus] = useState<NewsStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [syncingNews, setSyncingNews] = useState(false);

  useEffect(() => {
    if (settings) {
      setUsdtRate(settings.usdtToLkrRate?.toString() || "");
      setLkrRate(settings.lkrToUsdtRate?.toString() || "");
    }
  }, [settings]);

  // Load user settings
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await settingsService.get();
        if (!cancelled) setSettings(data);
      } catch {
        if (!cancelled) toast.error("Failed to load settings");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Poll Ollama AI scanning status every 3 seconds
  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const statusData = await newsService.getNewsStatus();
        if (active) {
          setNewsStatus(statusData);
          setStatusLoading(false);
        }
      } catch (err) {
        console.error("Failed to load news status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const update = async (next: UserSettings) => {
    setSettings(next);
    try {
      await settingsService.update(next);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleSaveRates = async () => {
    if (!settings) return;
    const ur = parseFloat(usdtRate);
    const lr = parseFloat(lkrRate);
    if (isNaN(ur) || isNaN(lr)) {
      toast.error("Please enter valid numbers");
      return;
    }

    await update({ ...settings, usdtToLkrRate: ur, lkrToUsdtRate: lr });
    setRateDialogOpen(false);
  };

  const handleManualSync = async () => {
    setSyncingNews(true);
    try {
      await newsService.syncNews();
      const nextStatus = await newsService.getNewsStatus();
      setNewsStatus(nextStatus);
      toast.success("Latest news ingested & queued for AI scanning!");
    } catch {
      toast.error("Failed to sync news");
    } finally {
      setSyncingNews(false);
    }
  };

  const pendingCount = newsStatus?.pendingValidation ?? 0;
  const validatedCount = newsStatus?.validatedCount ?? 0;
  const totalCount = newsStatus?.totalArticles ?? 0;
  const scannedPercentage = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 100;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings & System Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your trading dashboard & background services.</p>
        </div>

        {/* ── Appearance Card ───────────────────────────────────────────── */}
        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Dark mode</p>
                <p className="text-sm text-muted-foreground">
                  Use dark theme across the dashboard.
                </p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </CardContent>
        </Card>

        {/* ── Ollama AI News Scan Poll & Status Card (Replaces Notifications & Security) ── */}
        <Card className="gradient-card border-border/60 shadow-card bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="size-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold">Local Ollama AI News Scanner</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time status of background LLM news validation (<code className="text-primary/90">qwen3.5:4b</code>).
                  </p>
                </div>
              </div>

              {pendingCount > 0 ? (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1.5 px-2.5 py-1 text-xs animate-pulse">
                  <Sparkles className="size-3.5 animate-spin" /> Scanning Active ({pendingCount} left)
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5 px-2.5 py-1 text-xs">
                  <CheckCircle2 className="size-3.5" /> All Scanned & Up to Date
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            {/* Live Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" /> AI Scan Progress:
                </span>
                <span className="text-foreground font-mono">{scannedPercentage}% Scanned</span>
              </div>
              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden border border-border/40 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${scannedPercentage}%` }}
                />
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                <div className="text-[11px] font-medium text-amber-400/90 uppercase tracking-wider">Remaining to Scan</div>
                <div className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</div>
                <p className="text-[10px] text-muted-foreground">Articles in queue for Ollama AI</p>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                <div className="text-[11px] font-medium text-emerald-400/90 uppercase tracking-wider">AI Validated</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{validatedCount}</div>
                <p className="text-[10px] text-muted-foreground">Articles processed & verified</p>
              </div>

              <div className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Ingested</div>
                <div className="text-2xl font-bold font-mono text-foreground">{totalCount}</div>
                <p className="text-[10px] text-muted-foreground">Total saved in database</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" /> Auto-polling status every 3s
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={handleManualSync}
                disabled={syncingNews}
              >
                <RefreshCw className={cn("size-3.5", syncingNews && "animate-spin")} />
                Sync New Articles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Currency & Exchange Card ───────────────────────────────────── */}
        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Currency & Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">USDT to LKR Rate</p>
                <p className="text-sm text-muted-foreground">{settings?.usdtToLkrRate || 0}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">LKR to USDT Rate</p>
                <p className="text-sm text-muted-foreground">{settings?.lkrToUsdtRate || 0}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRateDialogOpen(true)}>
              Edit Rates
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Exchange Rates</DialogTitle>
            <DialogDescription>
              Set the conversion rates for your portfolio net worth.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">USDT to LKR Rate</label>
              <Input
                type="number"
                step="any"
                value={usdtRate}
                onChange={(e) => setUsdtRate(e.target.value)}
                placeholder="e.g. 300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">LKR to USDT Rate</label>
              <Input
                type="number"
                step="any"
                value={lkrRate}
                onChange={(e) => setLkrRate(e.target.value)}
                placeholder="e.g. 0.0033"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveRates()}>Save Rates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
