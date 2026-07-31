import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { isAuthenticated } from "@/lib/auth";
import { settingsService, type UserSettings } from "@/services/settings-service";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
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
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your experience.</p>
        </div>

        <Card className="gradient-card border-border shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Dark mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme across the dashboard.</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border shadow-card">
          <CardHeader><CardTitle className="text-base font-semibold">Notifications & security</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Email notifications</p>
                <p className="text-sm text-muted-foreground">Daily portfolio summary at market close.</p>
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
                <p className="text-sm text-muted-foreground">Get notified on watchlist movements &gt;5%.</p>
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
      </div>
    </AppShell>
  );
}
