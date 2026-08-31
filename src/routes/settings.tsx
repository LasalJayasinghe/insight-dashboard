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
      <div className="mx-auto max-w-5xl space-y-8">
        <Masthead
          eyebrow="Preferences"
          title="Settings & System"
          meta="Appearance, background intelligence services and currency conversion."
        />

        {/* ── Appearance ───────────────────────────────────────────── */}
        <Bento className="grid-cols-1">
          <Cell>
            <CellLabel index="I">Appearance</CellLabel>
            <div className="mt-4 flex items-center justify-between gap-6">
              <div>
                <p className="font-display text-sm font-semibold">Ink (dark) mode</p>
                <p className="text-xs text-muted-foreground">Switch between Paper and Ink themes.</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </Cell>
        </Bento>

        {/* ── Ollama AI News Scanner ───────────────────────────────── */}
        <Bento className="grid-cols-1">
          <Cell>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CellLabel index="II">
                  <span className="flex items-center gap-2">
                    <Cpu className="size-4 text-primary" />
                    Local Ollama News Scanner
                  </span>
                </CellLabel>
                <p className="mt-2 text-xs text-muted-foreground">
                  Background LLM validation of ingested market news
                  {" "}
                  <code className="font-mono text-[11px] text-primary">qwen3.5:4b</code>
                </p>
              </div>

              {pendingCount > 0 ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary"
                >
                  <Sparkles className="size-3 animate-pulse" /> Scanning · {pendingCount} queued
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success"
                >
                  <CheckCircle2 className="size-3" /> Up to date
                </Badge>
              )}
            </div>

            {/* Progress rule */}
            <div className="mt-5 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="label-caps flex items-center gap-1.5">
                  <Clock className="size-3" /> Scan progress
                </span>
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {statusLoading ? "—" : `${scannedPercentage}%`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${scannedPercentage}%` }}
                />
              </div>
            </div>
          </Cell>

          <div className="grid grid-cols-1 gap-px sm:grid-cols-3">
            <Cell>
              <CellLabel>Queued</CellLabel>
              <Figure value={pendingCount} size="md" className="mt-2" />
              <p className="mt-1 text-[11px] text-muted-foreground">Awaiting Ollama pass</p>
            </Cell>
            <Cell>
              <CellLabel>Validated</CellLabel>
              <Figure value={validatedCount} size="md" className="mt-2 text-success" />
              <p className="mt-1 text-[11px] text-muted-foreground">Processed & verified</p>
            </Cell>
            <Cell>
              <CellLabel>Ingested</CellLabel>
              <Figure value={totalCount} size="md" className="mt-2" />
              <p className="mt-1 text-[11px] text-muted-foreground">Total stored articles</p>
            </Cell>
          </div>

          <Cell className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Layers className="size-3 text-primary" /> Polling status every 3s
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={handleManualSync}
              disabled={syncingNews}
            >
              <RefreshCw className={cn("size-3.5", syncingNews && "animate-spin")} />
              Sync new articles
            </Button>
          </Cell>
        </Bento>

        {/* ── Currency & Exchange ──────────────────────────────────── */}
        <Bento className="grid-cols-1 sm:grid-cols-2">
          <Cell>
            <CellLabel index="III">USDT → LKR</CellLabel>
            <Figure value={settings?.usdtToLkrRate ?? 0} size="md" className="mt-2" />
          </Cell>
          <Cell>
            <CellLabel index="IV">LKR → USDT</CellLabel>
            <Figure value={settings?.lkrToUsdtRate ?? 0} size="md" className="mt-2" />
          </Cell>
          <Cell className="sm:col-span-2 py-3">
            <Button variant="outline" size="sm" onClick={() => setRateDialogOpen(true)}>
              Edit rates
            </Button>
          </Cell>
        </Bento>
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
