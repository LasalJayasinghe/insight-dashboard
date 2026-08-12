import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

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

  useEffect(() => {
    if (settings) {
      setUsdtRate(settings.usdtToLkrRate?.toString() || "");
      setLkrRate(settings.lkrToUsdtRate?.toString() || "");
    }
  }, [settings]);

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

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your experience.</p>
        </div>

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

        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Notifications & security</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Email notifications</p>
                <p className="text-sm text-muted-foreground">
                  Daily portfolio summary at market close.
                </p>
              </div>
              <Switch
                checked={settings?.emailNotifications ?? false}
                onCheckedChange={(v) => {
                  if (!settings) return;
                  void update({ ...settings, emailNotifications: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Price alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified on watchlist movements &gt;5%.
                </p>
              </div>
              <Switch
                checked={settings?.priceAlerts ?? false}
                onCheckedChange={(v) => {
                  if (!settings) return;
                  void update({ ...settings, priceAlerts: v });
                }}
              />
            </div>
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security.</p>
              </div>
              <Switch
                checked={settings?.twoFactorAuthentication ?? false}
                onCheckedChange={(v) => {
                  if (!settings) return;
                  void update({ ...settings, twoFactorAuthentication: v });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Currency & Exchange</CardTitle>
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
