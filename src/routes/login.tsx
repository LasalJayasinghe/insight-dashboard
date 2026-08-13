import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
      { title: "Sign in — AlertMe Trading Desk" },
      {
        name: "description",
        content: "Sign in to the AlertMe trading desk to track portfolios, alerts and strategies.",
      },
      { property: "og:title", content: "Sign in — AlertMe Trading Desk" },
      {
        property: "og:description",
        content: "Access your portfolios, price alerts and automated strategies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
      setErrors({ password: err?.response?.data?.message || "Invalid credentials" });
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
      setErrors({ password: err?.response?.data?.message || "Google login failed" });
      setStatus("error");
    }
  };

  const fieldClass = (invalid?: boolean) =>
    cn(
      "w-full border-0 border-b bg-transparent px-0 py-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground/60",
      invalid ? "border-destructive" : "border-hairline focus:border-primary",
    );

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Editorial cover */}
      <aside className="paper-grain relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center bg-primary-foreground font-display text-sm font-bold text-primary">
            A
          </div>
          <span className="font-display text-lg font-bold">AlertMe</span>
        </div>

        <div className="max-w-lg">
          <span className="label-caps text-primary-foreground/60">Vol. 01 — Trading Desk</span>
          <h2 className="mt-5 font-display text-5xl leading-[0.95] font-bold">
            Every position,
            <br />
            printed on one page.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-primary-foreground/70">
            Portfolios, live CSE prices, price alerts and automated strategies — set in a single
            legible ledger instead of a wall of widgets.
          </p>
        </div>

        <dl className="grid grid-cols-3 border-t border-primary-foreground/20 pt-6">
          {[
            ["Markets", "CSE · Crypto"],
            ["Alerts", "Real-time"],
            ["Strategies", "Automated"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-caps text-primary-foreground/50">{k}</dt>
              <dd className="mt-1.5 font-mono text-xs">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-8 place-items-center bg-primary font-display text-sm font-bold text-primary-foreground">
              A
            </div>
            <span className="font-display text-lg font-bold">AlertMe</span>
          </div>

          <span className="label-caps">Members only</span>
          <h1 className="mt-3 font-display text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your desk credentials to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-7" noValidate>
            <div>
              <label htmlFor="username" className="label-caps">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="trader@alertme.io"
                className={cn(fieldClass(!!errors.username), "mt-2")}
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label-caps">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(fieldClass(!!errors.password), "mt-2 pr-8")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-0 bottom-3 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-3.5 accent-[var(--color-primary)]"
                />
                Remember this device
              </label>
              <a href="#" className="text-xs underline underline-offset-4 hover:text-accent">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground uppercase transition-opacity hover:opacity-85 disabled:opacity-60"
            >
              {status === "loading" && <Loader2 className="size-3.5 animate-spin" />}
              {status === "success" && <CheckCircle2 className="size-3.5" />}
              {status === "loading" ? "Signing in" : status === "success" ? "Welcome" : "Sign in"}
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="label-caps">or</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <div className="flex w-full justify-center">
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

            <p className="pt-2 text-center text-xs text-muted-foreground">
              New to AlertMe?{" "}
              <Link to="/login" className="underline underline-offset-4 hover:text-accent">
                Request access
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
