import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Velox Trading" },
      { name: "description", content: "Manage your account information and password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPwd, setSavedPwd] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoadingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const changePwd = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (pwd.next.length < 8) return setPwdError("New password must be at least 8 characters");
    if (pwd.next !== pwd.confirm) return setPwdError("Passwords do not match");
    setLoadingPwd(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoadingPwd(false);
    setSavedPwd(true);
    setPwd({ current: "", next: "", confirm: "" });
    setTimeout(() => setSavedPwd(false), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and security.</p>
        </div>

        {/* Profile */}
        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Profile information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="size-20 border-2 border-border shadow-card">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">JT</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elegant hover:opacity-90"
                    aria-label="Change avatar"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold">Jamie Tan</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="username" label="Username" defaultValue="jamie.tan" />
                <Field id="email" label="Email" type="email" defaultValue="jamie.tan@velox.io" />
                <Field id="firstName" label="First name" defaultValue="Jamie" />
                <Field id="lastName" label="Last name" defaultValue="Tan" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {savedProfile && (
                  <span className="text-sm text-success flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Saved
                  </span>
                )}
                <Button variant="ghost" type="button">Cancel</Button>
                <Button type="submit" disabled={loadingProfile} className="gradient-primary text-primary-foreground shadow-elegant">
                  {loadingProfile && <Loader2 className="size-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePwd} className="space-y-4 max-w-md">
              <Field id="current" label="Current password" type="password" value={pwd.current} onChange={(v) => setPwd({ ...pwd, current: v })} />
              <Field id="next" label="New password" type="password" value={pwd.next} onChange={(v) => setPwd({ ...pwd, next: v })} />
              <Field id="confirm" label="Confirm new password" type="password" value={pwd.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} />

              {pwdError && (
                <p className={cn("text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md")}>{pwdError}</p>
              )}

              <div className="flex items-center justify-end gap-3">
                {savedPwd && (
                  <span className="text-sm text-success flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Updated
                  </span>
                )}
                <Button type="submit" disabled={loadingPwd} className="gradient-primary text-primary-foreground shadow-elegant">
                  {loadingPwd && <Loader2 className="size-4 animate-spin" />}
                  Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}
function Field({ id, label, type = "text", defaultValue, value, onChange }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-11"
      />
    </div>
  );
}
