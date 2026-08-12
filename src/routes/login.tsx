import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { TrendingUp, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { login, googleLogin } from "@/services/authService";
import { GoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — AlertMe Trading" },
      { name: "description", content: "Sign in to your AlertMe trading dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = "Username is required";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setStatus("loading");

    try {
      const data = await login(username, password);

      if (!data.ok) {
        setErrors({ password: "Invalid username or password" });
        setStatus("error");
        return;
      }

      setStatus("success");

      setTimeout(() => navigate({ to: "/dashboard" }), 400);
    } catch (err: any) {
      console.error(err);
      setErrors({
        password: err?.response?.data?.message || "Invalid credentials",
      });
      setStatus("error");
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    setStatus("loading");
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (!data.ok) {
        setErrors({ password: "Google login failed" });
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => navigate({ to: "/dashboard" }), 400);
    } catch (err: any) {
      console.error(err);
      setErrors({
        password: err?.response?.data?.message || "Google login failed",
      });
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* glow accents */}
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-8 gradient-card border-border shadow-elegant relative z-10">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <TrendingUp className="size-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">AlertMe</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Trading Platform
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to manage your portfolio.</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="trader@AlertMe.io"
              className={cn(
                "h-11",
                errors.username && "border-destructive focus-visible:ring-destructive",
              )}
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.username}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "h-11 pr-10",
                  errors.password && "border-destructive focus-visible:ring-destructive",
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember me
            </label>
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full h-11 gradient-primary text-primary-foreground font-medium shadow-elegant hover:opacity-95 transition"
          >
            {status === "loading" && <Loader2 className="size-4 animate-spin" />}
            {status === "success" && <CheckCircle2 className="size-4" />}
            {status === "loading" ? "Signing in..." : status === "success" ? "Welcome" : "Sign in"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => {
                console.error("Google Login Failed");
                setErrors({ password: "Google login failed" });
              }}
              useOneTap
              theme="outline"
              size="large"
              shape="rectangular"
              text="signin_with"
            />
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            New to AlertMe?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Request access
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
