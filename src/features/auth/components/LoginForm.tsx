"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  Mail,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { FaCalendarAlt, FaLock } from "react-icons/fa";

import { useAuth } from "@/features/auth/context/AuthContext";
import * as authService from "@/features/auth/services/authService";
import { AppError } from "@/features/auth/services/apiClient";
import {
  loginSchema,
  forgotPasswordSchema,
  otpSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";
import {
  Field,
  InputWithIcon,
  SubmitButton,
  EmailBadge,
  ShimmerStyle,
  FaEnvelope,
} from "@/components/auth/shared";
import { OtpInput } from "@/features/auth/components/OtpInput";

// ─── Panel wrapper ────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: "spring", damping: 28, stiffness: 340 }}
      className="relative w-full max-w-md rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-modal-bg, var(--color-bg-elevated))",
        border: "1px solid var(--color-card-border)",
        borderLeft: "4px solid var(--color-accent-primary)",
        boxShadow: "0 32px 80px var(--color-shadow)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <Link
        href="/"
        aria-label="Close and go home"
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:!text-[var(--color-text-primary)]"
        style={{ color: "var(--color-text-tertiary)", background: "var(--color-bg-tertiary)" }}
      >
        <X size={16} />
      </Link>
      {children}
    </motion.div>
  );
}

// ─── Panel header ─────────────────────────────────────────────

function PanelHeader({
  icon,
  title,
  subtitle,
  accentVar = "--color-accent-primary",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  accentVar?: string;
}) {
  return (
    <div
      className="relative px-6 pt-6 pb-5"
      style={{ borderBottom: "1px solid var(--color-border-secondary)" }}
    >
      <div
        className="absolute top-0 right-0 w-28 h-28 opacity-[0.05] pointer-events-none"
        style={{
          background: `repeating-linear-gradient(-45deg, var(${accentVar}), var(${accentVar}) 2px, transparent 2px, transparent 12px)`,
        }}
      />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `color-mix(in srgb, var(${accentVar}) 14%, transparent)`,
            border: `1.5px solid color-mix(in srgb, var(${accentVar}) 28%, transparent)`,
            color: `var(${accentVar})`,
          }}
        >
          {icon}
        </div>
        <div>
          <h2
            className="text-[15px] font-bold leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OTP verify (after login when email not verified) ────────

function VerifyOTPStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = otpSchema.safeParse({ otp });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Enter all 6 digits"); return; }
    setLoading(true);
    try {
      await authService.verifyEmailOtp({ email, otp: result.data.otp });
      setDone(true);
      setTimeout(onVerified, 1500);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try { await authService.resendVerification(email); setOtp(""); } catch {}
    finally { setResending(false); }
  };

  if (done) {
    return (
      <Panel>
        <div className="p-10 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border-2"
            style={{ background: "var(--color-success-bg)", borderColor: "var(--color-success)" }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: "var(--color-success)" }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Email Verified!
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Redirecting…
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <ShimmerStyle />
      <PanelHeader
        icon={<Mail size={16} />}
        title="Verification Required"
        subtitle="Enter the OTP from your email"
      />
      <div className="px-6 pb-7 pt-5">
        <EmailBadge email={email} />
        <p className="text-xs mb-6 leading-relaxed text-center" style={{ color: "var(--color-text-tertiary)" }}>
          Enter the <strong style={{ color: "var(--color-text-secondary)" }}>6-digit OTP</strong> we sent.
          Check your spam folder if you don&apos;t see it.
        </p>
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(""); }} error={!!error} disabled={loading} />
            {error && (
              <p className="flex items-center gap-1.5 text-xs justify-center" style={{ color: "var(--color-danger)" }}>
                <AlertCircle size={10} />{error}
              </p>
            )}
            <p className="text-[10px] text-center" style={{ color: "var(--color-text-tertiary)" }}>
              OTP expires in 15 minutes
            </p>
          </div>
          <SubmitButton loading={loading} loadingText="Verifying…">
            <CheckCircle size={14} /> Verify Email
          </SubmitButton>
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-medium disabled:opacity-40 transition-colors"
              style={{ color: "var(--color-accent-primary)" }}
            >
              {resending
                ? <span className="flex items-center gap-1 justify-center"><Loader2 size={10} className="animate-spin" />Sending…</span>
                : "Didn't receive it? Resend OTP"}
            </button>
          </div>
          <div className="text-center">
            <button type="button" onClick={onBack} className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Back to login
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

// ─── Forgot password — step 1 (enter email) ──────────────────

function ForgotStep1({
  onNext,
  onBack,
}: {
  onNext: (email: string) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Enter a valid email address"); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(result.data.email);
      onNext(result.data.email);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <ShimmerStyle />
      <PanelHeader
        icon={<FaLock size={14} />}
        title="Forgot Password"
        subtitle="We'll send a 6-digit OTP to reset it"
        accentVar="--color-info"
      />
      <div className="px-6 pb-7 pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email Address" error={error} delay={0.05}>
            <InputWithIcon
              icon={<FaEnvelope className="w-3.5 h-3.5" />}
              type="email" value={email} placeholder="you@example.com"
              error={!!error} required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--color-info, #3B82F6), #2563EB)",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--color-info, #3B82F6) 28%, transparent)",
              opacity: loading ? 0.55 : 1,
            }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" />Sending OTP…</>
              : <><Mail size={14} />Send OTP</>}
          </motion.button>
          <div className="text-center">
            <button type="button" onClick={onBack} className="text-xs font-medium"
              style={{ color: "var(--color-accent-primary)" }}>
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

// ─── Forgot password — step 2 (OTP + new password) ───────────

function ForgotStep2({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = resetPasswordSchema.safeParse({ otp: otp.trim(), newPassword, confirmPassword: newPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue: { path: PropertyKey[]; message: string }) => {
        const field = String(issue.path[0]);
        if (field === "otp") errs.otp = issue.message;
        else if (field === "newPassword") errs.password = issue.message;
      });
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp: otp.trim(), newPassword });
      setDone(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Something went wrong";
      if (/otp|invalid|expired/i.test(msg)) setErrors({ otp: msg });
      else setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try { await authService.forgotPassword(email); setOtp(""); } catch {}
    finally { setResending(false); }
  };

  if (done) {
    return (
      <Panel>
        <div className="p-10 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border-2"
            style={{ background: "var(--color-success-bg)", borderColor: "var(--color-success)" }}>
            <CheckCircle className="w-7 h-7" style={{ color: "var(--color-success)" }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Password Reset!</h2>
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Redirecting to sign in…</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <ShimmerStyle />
      <PanelHeader
        icon={<FaLock size={14} />}
        title="Reset Password"
        subtitle={`OTP sent to ${email}`}
        accentVar="--color-info"
      />
      <div className="px-6 pb-7 pt-5">
        <EmailBadge email={email} />
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-text-tertiary)" }}>
              6-Digit OTP
            </label>
            <OtpInput value={otp} onChange={(v) => { setOtp(v); setErrors((p) => ({ ...p, otp: "" })); }}
              error={!!errors.otp} disabled={loading} />
            {errors.otp && (
              <p className="flex items-center gap-1.5 text-xs justify-center" style={{ color: "var(--color-danger)" }}>
                <AlertCircle size={10} />{errors.otp}
              </p>
            )}
          </div>
          <Field label="New Password" error={errors.password} delay={0.08}>
            <InputWithIcon icon={<FaLock className="w-3.5 h-3.5" />}
              type="password" value={newPassword} placeholder="Min. 6 characters"
              error={!!errors.password} required minLength={6}
              onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <SubmitButton loading={loading} loadingText="Resetting…">
            Reset Password
          </SubmitButton>
          <div className="flex justify-between text-xs">
            <button type="button" onClick={handleResend} disabled={resending}
              className="font-medium disabled:opacity-40" style={{ color: "var(--color-accent-primary)" }}>
              {resending ? "Sending…" : "Resend OTP"}
            </button>
            <button type="button" onClick={onBack} style={{ color: "var(--color-text-tertiary)" }}>
              Back
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

// ─── Login form ───────────────────────────────────────────────

type View = "login" | "forgot1" | "forgot2" | "verify";

// ─── Main export ──────────────────────────────────────────────

export function LoginForm() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--color-bg-tertiary)" }}>
        <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-tertiary)" }}>
      <ShimmerStyle />
      <AnimatePresence mode="wait">
        {view === "verify" && (
          <VerifyOTPStep
            key="verify"
            email={verifyEmail}
            onVerified={() => setView("login")}
            onBack={() => setView("login")}
          />
        )}
        {view === "forgot1" && (
          <ForgotStep1
            key="forgot1"
            onNext={(email) => { setForgotEmail(email); setView("forgot2"); }}
            onBack={() => setView("login")}
          />
        )}
        {view === "forgot2" && (
          <ForgotStep2
            key="forgot2"
            email={forgotEmail}
            onSuccess={() => setView("login")}
            onBack={() => setView("forgot1")}
          />
        )}
        {view === "login" && (
          <LoginFormInner
            key="login"
            onForgot={() => setView("forgot1")}
            onVerify={(email) => { setVerifyEmail(email); setView("verify"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Login form (inner, stateless about view) ─────────────────

function LoginFormInner({
  onForgot,
  onVerify,
}: {
  onForgot: () => void;
  onVerify: (email: string) => void;
}) {
  const { applyLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue: { path: PropertyKey[]; message: string }) => {
        const field = String(issue.path[0]);
        if (field) errs[field] = issue.message;
      });
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(result.data);
      applyLogin(res);
      router.push("/");
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Login failed. Please try again.";
      if (/verif/i.test(msg) || (err instanceof AppError && err.status === 403)) {
        onVerify(email.trim().toLowerCase());
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <ShimmerStyle />
      <PanelHeader
        icon={<FaEnvelope size={14} />}
        title={<>Sign in to <span style={{ color: "var(--color-accent-primary)" }}>WeCinema</span></>}
        subtitle="Welcome back 👋"
      />
      <div className="px-6 pb-7 pt-5">
        {errors.general && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl text-sm mb-4"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)" }}>
            <AlertCircle size={14} className="flex-shrink-0" />{errors.general}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email Address" error={errors.email} delay={0.05}>
            <InputWithIcon icon={<FaEnvelope className="w-3.5 h-3.5" />}
              type="email" value={email} placeholder="you@example.com"
              error={!!errors.email} required
              onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={errors.password} delay={0.1}>
            <InputWithIcon icon={<FaLock className="w-3.5 h-3.5" />}
              type="password" value={password} placeholder="••••••••"
              error={!!errors.password} required
              onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="flex justify-between text-xs pt-0.5">
            <button type="button" onClick={onForgot}
              className="font-medium" style={{ color: "var(--color-accent-primary)" }}>
              Forgot password?
            </button>
            <Link href="/explore" className="font-medium" style={{ color: "var(--color-accent-primary)" }}>
              HypeMode?
            </Link>
          </div>
          <SubmitButton loading={loading} loadingText="Signing in…">
            Sign in <ChevronRight size={14} />
          </SubmitButton>
          <p className="text-center text-xs pt-4"
            style={{ color: "var(--color-text-tertiary)", borderTop: "1px solid var(--color-divider)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold" style={{ color: "var(--color-accent-primary)" }}>
              Create Account
            </Link>
          </p>
        </form>
      </div>
    </Panel>
  );
}
