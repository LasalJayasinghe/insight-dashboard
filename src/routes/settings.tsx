import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Settings — Velox Trading" },
      { name: "description", content: "Configure your trading dashboard preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const rows = [
    { label: "Email notifications", desc: "Daily portfolio summary at market close.", enabled: true },
    { label: "Price alerts", desc: "Get notified on watchlist movements >5%.", enabled: true },
    { label: "Two-factor authentication", desc: "Add an extra layer of security.", enabled: false },
  ];

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
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <Switch defaultChecked={r.enabled} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
