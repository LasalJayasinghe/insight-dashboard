import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, CheckCircle2, Send, User2, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfile , updateProfile, changePassword, updateTelegramId } from "@/services/profileService";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Account Settings — AlertMe Trading" },
      {
        name: "description",
        content: "Manage your profile, security, and Telegram notifications.",
      },
    ],
  }),
  component: ProfilePage,
});

type ProfileState = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
};

function ProfilePage() {
  const navigate = useNavigate();
  // Profile
  const [profile, setProfile] = useState<ProfileState>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    avatar: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [savedPwd, setSavedPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Telegram
  const [telegramChatId, setTelegramChatId] = useState("");
  const [savingTg, setSavingTg] = useState(false);
  const [savedTg, setSavedTg] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);

      try {
        const data = await getProfile();

        setProfile({
          username: data.username || "",
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          avatar: data.avatar || "",
        });
        setTelegramChatId(data.telegramId || "");
      } catch {
        if (!cancelled) setProfileError("Could not load your profile.");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };

  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!profile.username.trim() || !profile.email.trim()) {
      setProfileError("Username and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
      setProfileError("Please enter a valid email address.");
      return;
    }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await updateProfile(profile);
      if (!res.ok) throw new Error("Failed to update profile");
      setSavedProfile(true);
      toast.success("Profile updated");
      setTimeout(() => setSavedProfile(false), 2500);
    } catch {
      setProfileError("Failed to update profile.");
      toast.error("Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePwd = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (!pwd.current) return setPwdError("Enter your current password.");
    if (pwd.next.length < 8) return setPwdError("New password must be at least 8 characters.");
    if (pwd.next === pwd.current)
      return setPwdError("New password must differ from current password.");
    if (pwd.next !== pwd.confirm) return setPwdError("Passwords do not match.");
    setSavingPwd(true);
    try {
      const res = await changePassword({ current: pwd.current, next: pwd.next });
      if (!res.success) {
        setPwdError(res.message || "Failed to change password.");
        return;
      }

      setSavedPwd(true);
      setPwd({ current: "", next: "", confirm: "" });
      toast.success("Password updated");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1000);
    } catch {
      setPwdError("Failed to change password.");
    } finally {
      setSavingPwd(false);
    }
  };

  const saveTelegram = async (e: FormEvent) => {
    e.preventDefault();
    setTgError(null);
    const trimmed = telegramChatId.trim();
    if (trimmed && !/^-?\d{4,}$/.test(trimmed)) {
      return setTgError("Chat ID must be numeric (e.g. 123456789).");
    }
    setSavingTg(true);
    try {
      const res = await updateTelegramId(trimmed);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setTgError(errData.message || "Failed to save Telegram Chat ID.");
        return;
      }
      setSavedTg(true);
      toast.success("Telegram settings saved");
      setTimeout(() => setSavedTg(false), 2500);
    } catch {
      setTgError("Failed to save Telegram Chat ID.");
    } finally {
      setSavingTg(false);
    }
  };

  const pwdStrength = useMemo(() => scorePassword(pwd.next), [pwd.next]);

  const initials =
    (profile.firstName?.[0] || profile.username?.[0] || "U").toUpperCase() +
    (profile.lastName?.[0] || "").toUpperCase();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Account settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, security, and notification preferences.
          </p>
        </header>

        {/* Profile */}
        <SettingsCard
          icon={<User2 className="size-4" />}
          title="Profile information"
          description="Update your personal details visible across the platform."
        >
          {profileLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-6" noValidate>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="size-20 border-2 border-border shadow-card">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elegant hover:opacity-90 transition-opacity"
                    aria-label="Change avatar"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold">
                    {profile.firstName || profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`.trim()
                      : profile.username || "Your profile"}
                  </p>
                  <p className="text-sm text-muted-foreground">PNG or JPG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  id="username"
                  label="Username"
                  value={profile.username}
                  onChange={(v) => setProfile((p) => ({ ...p, username: v }))}
                  autoComplete="username"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                  autoComplete="email"
                />
                <Field
                  id="firstName"
                  label="First name"
                  value={profile.firstName}
                  onChange={(v) => setProfile((p) => ({ ...p, firstName: v }))}
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Last name"
                  value={profile.lastName}
                  onChange={(v) => setProfile((p) => ({ ...p, lastName: v }))}
                  autoComplete="family-name"
                />
              </div>

              {profileError && <InlineError message={profileError} />}

              <FormFooter
                saved={savedProfile}
                savedLabel="Saved"
                loading={savingProfile}
                submitLabel="Save profile"
              />
            </form>
          )}
        </SettingsCard>

        {/* Security */}
        <SettingsCard
          icon={<ShieldCheck className="size-4" />}
          title="Security"
          description="Change your password to keep your account safe."
        >
          <form onSubmit={changePwd} className="space-y-4 max-w-md" autoComplete="off" noValidate>
            <Field
              id="current"
              label="Current password"
              type="password"
              value={pwd.current}
              onChange={(v) => setPwd({ ...pwd, current: v })}
              autoComplete="current-password"
            />
            <div className="space-y-2">
              <Field
                id="next"
                label="New password"
                type="password"
                value={pwd.next}
                onChange={(v) => setPwd({ ...pwd, next: v })}
                autoComplete="new-password"
              />
              {pwd.next.length > 0 && <PasswordStrengthMeter score={pwdStrength} />}
            </div>
            <Field
              id="confirm"
              label="Confirm new password"
              type="password"
              value={pwd.confirm}
              onChange={(v) => setPwd({ ...pwd, confirm: v })}
              autoComplete="new-password"
            />

            {pwdError && <InlineError message={pwdError} />}

            <FormFooter
              saved={savedPwd}
              savedLabel="Updated"
              loading={savingPwd}
              submitLabel="Update password"
            />
          </form>
        </SettingsCard>

        {/* Telegram */}
        <SettingsCard
          icon={<Send className="size-4" />}
          title="Telegram notifications"
          description="Receive real-time alerts in your Telegram chat."
        >
          <form onSubmit={saveTelegram} className="space-y-4 max-w-md" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
              <Input
                id="telegramChatId"
                inputMode="numeric"
                placeholder="e.g. 123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value.replace(/[^\d-]/g, ""))}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Open <span className="font-medium text-foreground">@userinfobot</span> on Telegram
                and send <span className="font-mono">/start</span> to get your numeric Chat ID.
              </p>
            </div>

            {tgError && <InlineError message={tgError} />}

            <FormFooter
              saved={savedTg}
              savedLabel="Saved"
              loading={savingTg}
              submitLabel="Save Telegram settings"
            />
          </form>
        </SettingsCard>
      </div>
    </AppShell>
  );
}

/* ---------- Subcomponents ---------- */

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gradient-card border-border shadow-card">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          {title}
        </CardTitle>
        {description && <CardDescription className="pl-9">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormFooter({
  saved,
  savedLabel,
  loading,
  submitLabel,
}: {
  saved: boolean;
  savedLabel: string;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-1">
      {saved && (
        <span className="text-sm text-success flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
          <CheckCircle2 className="size-4" /> {savedLabel}
        </span>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="gradient-primary text-primary-foreground shadow-elegant min-w-[10rem]"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-start gap-2">
      <AlertCircle className="size-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function PasswordStrengthMeter({ score }: { score: number }) {
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-success", "bg-success"];
  const safe = Math.max(0, Math.min(4, score));
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < safe ? colors[safe] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{labels[safe]}</span>
      </p>
    </div>
  );
}

function scorePassword(p: string): number {
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(4, score);
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}
function Field({ id, label, type = "text", value, onChange, autoComplete }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-11"
      />
    </div>
  );
}
