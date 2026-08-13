import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { login, googleLogin, sendOtp, registerWithOtp, resetPasswordWithOtp } from "@/services/authService";
import { GoogleLogin } from "@react-oauth/google";

interface EditorialVolume {
  vol: string;
  lines: string[];
  description: string;
  stats: [string, string][];
}

const EDITORIAL_VOLUMES: EditorialVolume[] = [
  {
    vol: "Vol. 01 — Trading Desk",
    lines: ["Every position,", "printed on one page."],
    description:
      "Portfolios, live CSE prices, price alerts and automated strategies — set in a single legible ledger instead of a wall of widgets.",
    stats: [
      ["Markets", "CSE · Crypto"],
      ["Alerts", "Real-time"],
      ["Strategies", "Automated"],
    ],
  },
  {
    vol: "Vol. 02 — Portfolio Manager",
    lines: ["Manage portfolios,", "track live performance."],
    description:
      "Monitor your equity holdings and digital assets with instant P&L analytics, execution history, and unified balance ledgers.",
    stats: [
      ["Tracking", "Multi-asset"],
      ["Analytics", "Live P&L"],
      ["Ledger", "Unified"],
    ],
  },
  {
    vol: "Vol. 03 — Crypto Algorithms",
    lines: ["Algorithms for crypto,", "automated execution."],
    description:
      "Deploy rule-based execution bots, grid strategies, and smart trigger conditions designed for 24/7 high precision markets.",
    stats: [
      ["Bots", "Grid & DCA"],
      ["Uptime", "24/7 Exec"],
      ["Logic", "Custom triggers"],
    ],
  },
  {
    vol: "Vol. 04 — Signal Matrix",
    lines: ["Precision alerts,", "zero latency."],
    description:
      "Configure multi-condition price triggers and receive instant notifications via Telegram, webhooks, or push alerts.",
    stats: [
      ["Latency", "< 50ms"],
      ["Hooks", "Telegram · Webhook"],
      ["Coverage", "100% Symbols"],
    ],
  },
];

function AnimatedLetters({
  text,
  className,
  baseDelay = 0,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
}) {
  const words = text.split(" ");
  let charCounter = 0;

  return (
    <span className={cn("inline-block", className)}>
      {words.map((word, wordIdx) => {
        const chars = word.split("");
        const startIdx = charCounter;
        charCounter += chars.length + 1;

        return (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {chars.map((char, charIdx) => {
              const globalIdx = startIdx + charIdx;
              const delay = baseDelay + globalIdx * 24;
              return (
                <span
                  key={charIdx}
                  className="animate-letter-reveal"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {char}
                </span>
              );
            })}
            {wordIdx < words.length - 1 && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

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

type AuthMode = "signin" | "signup" | "signup-otp" | "forgot" | "forgot-otp";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [serverMsg, setServerMsg] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [volIndex, setVolIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVolIndex((prev) => (prev + 1) % EDITORIAL_VOLUMES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [volIndex]);

  const activeVol = EDITORIAL_VOLUMES[volIndex];

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  const resetFormState = () => {
    setErrors({});
    setStatus("idle");
    setServerMsg("");
    setOtpCode("");
  };

  const switchMode = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  // Sign In submit
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    const eMap: typeof errors = {};
    if (!username.trim()) eMap.username = "Username or Email is required";
    if (password.length < 6) eMap.password = "Password must be at least 6 characters";
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) return;

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

  // Request Sign Up OTP
  const handleRequestSignUpOtp = async (e: FormEvent) => {
    e.preventDefault();
    const eMap: typeof errors = {};
    if (!email.trim() || !email.includes("@")) eMap.email = "Valid email address is required";
    if (password.length < 6) eMap.password = "Password must be at least 6 characters";
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) return;

    setStatus("loading");
    try {
      const res = await sendOtp(email, "SignUp");
      setStatus("idle");
      setServerMsg(res.message || "Verification code sent to your email!");
      setMode("signup-otp");
    } catch (err: any) {
      console.error(err);
      setErrors({ email: err?.response?.data?.message || "Failed to send verification code." });
      setStatus("error");
    }
  };

  // Complete Registration with OTP
  const handleCompleteRegistration = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setErrors({ otpCode: "Please enter the complete 6-digit code" });
      return;
    }

    setStatus("loading");
    try {
      const res = await registerWithOtp(email, password, firstName, lastName, otpCode);
      setStatus("success");
      setTimeout(() => navigate({ to: "/dashboard" }), 400);
    } catch (err: any) {
      console.error(err);
      setErrors({ otpCode: err?.response?.data?.message || "Invalid or expired verification code." });
      setStatus("error");
    }
  };

  // Request Forgot Password OTP
  const handleRequestForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrors({ email: "Valid email address is required" });
      return;
    }

    setStatus("loading");
    try {
      const res = await sendOtp(email, "ForgotPassword");
      setStatus("idle");
      setServerMsg(res.message || "Password reset code sent to your email.");
      setMode("forgot-otp");
    } catch (err: any) {
      console.error(err);
      setErrors({ email: err?.response?.data?.message || "No account found with this email." });
      setStatus("error");
    }
  };

  // Complete Password Reset with OTP
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const eMap: typeof errors = {};
    if (!otpCode.trim() || otpCode.length < 6) eMap.otpCode = "6-digit code is required";
    if (newPassword.length < 6) eMap.newPassword = "New password must be at least 6 characters";
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) return;

    setStatus("loading");
    try {
      const res = await resetPasswordWithOtp(email, newPassword, otpCode);
      setStatus("success");
      setServerMsg("Password reset successfully! Please sign in.");
      setTimeout(() => switchMode("signin"), 1500);
    } catch (err: any) {
      console.error(err);
      setErrors({ otpCode: err?.response?.data?.message || "Invalid or expired code." });
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center bg-primary-foreground font-display text-sm font-bold text-primary">
              A
            </div>
            <span className="font-display text-lg font-bold">AlertMe</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary-foreground/50">
            <span>0{volIndex + 1}</span>
            <span>/</span>
            <span>0{EDITORIAL_VOLUMES.length}</span>
          </div>
        </div>

        <div className="max-w-lg my-auto py-8">
          {/* Progress timeline bars */}
          <div className="mb-8 flex items-center gap-2">
            {EDITORIAL_VOLUMES.map((v, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setVolIndex(idx)}
                title={v.vol}
                className={cn(
                  "relative h-1 flex-1 overflow-hidden rounded-full transition-all duration-300 cursor-pointer",
                  idx === volIndex
                    ? "bg-primary-foreground/30"
                    : "bg-primary-foreground/15 hover:bg-primary-foreground/30"
                )}
                aria-label={`Switch to ${v.vol}`}
              >
                {idx === volIndex && (
                  <span
                    key={`bar-${volIndex}`}
                    className="absolute inset-y-0 left-0 bg-primary-foreground animate-progress-bar"
                  />
                )}
              </button>
            ))}
          </div>

          <div key={`vol-${volIndex}`} className="animate-fade-slide-up">
            <span className="label-caps text-primary-foreground/60">{activeVol.vol}</span>
          </div>

          <h2 key={`h2-${volIndex}`} className="mt-5 font-display text-5xl leading-[0.95] font-bold min-h-[105px]">
            {activeVol.lines.map((line, idx) => (
              <span key={idx} className="block">
                <AnimatedLetters text={line} baseDelay={idx * 140} />
              </span>
            ))}
          </h2>

          <p
            key={`desc-${volIndex}`}
            className="mt-6 max-w-md text-sm leading-relaxed text-primary-foreground/70 animate-fade-slide-up min-h-[60px]"
            style={{ animationDelay: "280ms" }}
          >
            {activeVol.description}
          </p>
        </div>

        <dl key={`stats-${volIndex}`} className="grid grid-cols-3 border-t border-primary-foreground/20 pt-6 animate-fade-slide-up">
          {activeVol.stats.map(([k, v]) => (
            <div key={k}>
              <dt className="label-caps text-primary-foreground/50">{k}</dt>
              <dd className="mt-1.5 font-mono text-xs text-primary-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Interactive Form Panel */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-8 place-items-center bg-primary font-display text-sm font-bold text-primary-foreground">
              A
            </div>
            <span className="font-display text-lg font-bold">AlertMe</span>
          </div>

          {/* MODE 1: SIGN IN */}
          {mode === "signin" && (
            <div className="animate-fade-slide-up">
              <span className="label-caps">Members only</span>
              <h1 className="mt-3 font-display text-3xl font-bold">Sign in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your desk credentials to continue.
              </p>

              {serverMsg && (
                <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded text-xs text-success flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{serverMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="mt-8 space-y-7" noValidate>
                <div>
                  <label htmlFor="username" className="label-caps">
                    Username / Email
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
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs underline underline-offset-4 hover:text-accent cursor-pointer"
                  >
                    Forgot password?
                  </button>
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
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="underline underline-offset-4 font-semibold text-foreground hover:text-accent cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* MODE 2: SIGN UP STEP 1 */}
          {mode === "signup" && (
            <div className="animate-fade-slide-up">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Back to Sign in
              </button>

              <span className="label-caps">Get Access</span>
              <h1 className="mt-2 font-display text-3xl font-bold">Create account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your details to receive an Email verification code.
              </p>

              <form onSubmit={handleRequestSignUpOtp} className="mt-8 space-y-6" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-caps">First Name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className={cn(fieldClass(), "mt-2")}
                    />
                  </div>
                  <div>
                    <label className="label-caps">Last Name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Morgan"
                      className={cn(fieldClass(), "mt-2")}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-caps">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@alertme.io"
                    className={cn(fieldClass(!!errors.email), "mt-2")}
                  />
                  {errors.email && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label-caps">Password</label>
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={cn(fieldClass(!!errors.password), "mt-2")}
                  />
                  {errors.password && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground uppercase transition-opacity hover:opacity-85 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Sending Verification Code
                    </>
                  ) : (
                    <>
                      <Mail className="size-3.5" /> Send Verification Code
                    </>
                  )}
                </button>

                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="underline underline-offset-4 font-semibold text-foreground hover:text-accent cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* MODE 3: SIGN UP STEP 2 (OTP VERIFICATION) */}
          {mode === "signup-otp" && (
            <div className="animate-fade-slide-up">
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Edit details
              </button>

              <span className="label-caps">Email Verification</span>
              <h1 className="mt-2 font-display text-3xl font-bold">Enter 6-digit OTP</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
              </p>

              <form onSubmit={handleCompleteRegistration} className="mt-8 space-y-6" noValidate>
                <div>
                  <label className="label-caps">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="482910"
                    className="w-full mt-2 border-0 border-b border-hairline focus:border-primary bg-transparent px-0 py-3 font-mono text-center text-2xl tracking-[0.4em] outline-none placeholder:text-muted-foreground/30"
                    autoFocus
                  />
                  {errors.otpCode && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.otpCode}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || otpCode.length < 6}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground uppercase transition-opacity hover:opacity-85 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Verifying Code
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" /> Complete Registration
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleRequestSignUpOtp}
                    className="underline underline-offset-4 hover:text-accent cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 4: FORGOT PASSWORD STEP 1 */}
          {mode === "forgot" && (
            <div className="animate-fade-slide-up">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Back to Sign in
              </button>

              <span className="label-caps">Account Recovery</span>
              <h1 className="mt-2 font-display text-3xl font-bold">Reset Password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your registered email address to receive a password reset code.
              </p>

              <form onSubmit={handleRequestForgotOtp} className="mt-8 space-y-6" noValidate>
                <div>
                  <label className="label-caps">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@alertme.io"
                    className={cn(fieldClass(!!errors.email), "mt-2")}
                  />
                  {errors.email && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground uppercase transition-opacity hover:opacity-85 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Sending Code
                    </>
                  ) : (
                    <>
                      <Mail className="size-3.5" /> Send Reset Code
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 5: FORGOT PASSWORD STEP 2 (OTP & NEW PASSWORD) */}
          {mode === "forgot-otp" && (
            <div className="animate-fade-slide-up">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Change email
              </button>

              <span className="label-caps">Security Reset</span>
              <h1 className="mt-2 font-display text-3xl font-bold">Set New Password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong> and your new password.
              </p>

              <form onSubmit={handleResetPassword} className="mt-8 space-y-6" noValidate>
                <div>
                  <label className="label-caps">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="482910"
                    className="w-full mt-2 border-0 border-b border-hairline focus:border-primary bg-transparent px-0 py-3 font-mono text-center text-xl tracking-[0.3em] outline-none placeholder:text-muted-foreground/30"
                    autoFocus
                  />
                  {errors.otpCode && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.otpCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label-caps">New Password</label>
                  <input
                    type={show ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={cn(fieldClass(!!errors.newPassword), "mt-2")}
                  />
                  {errors.newPassword && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || otpCode.length < 6}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground uppercase transition-opacity hover:opacity-85 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Resetting Password
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" /> Reset Password & Sign in
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
