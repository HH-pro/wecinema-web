"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronRight, Loader2, Mail } from "lucide-react";
import { FaCalendarAlt, FaLock, FaUser } from "react-icons/fa";

import { useAuth } from "@/features/auth/context/AuthContext";
import * as authService from "@/features/auth/services/authService";
import { AppError } from "@/features/auth/services/apiClient";
import { registerSchema, otpSchema } from "@/lib/validation/schemas";
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
      {children}
    </motion.div>
  );
}

function PanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div
      className="relative px-6 pt-6 pb-5"
      style={{ borderBottom: "1px solid var(--color-border-secondary)" }}
    >
      <div
        className="absolute top-0 right-0 w-28 h-28 opacity-[0.05] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(-45deg, var(--color-accent-primary), var(--color-accent-primary) 2px, transparent 2px, transparent 12px)",
        }}
      />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "color-mix(in srgb, var(--color-accent-primary) 14%, transparent)",
            border:
              "1.5px solid color-mix(in srgb, var(--color-accent-primary) 28%, transparent)",
            color: "var(--color-accent-primary)",
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

// ─── OTP verify step ─────────────────────────────────────────

function VerifyOTPStep({
  email,
  username,
  onVerified,
  onBack,
}: {
  email: string;
  username: string;
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
            Redirecting to sign in…
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
        title="Verify Your Email"
        subtitle={username ? `Hey ${username}! Check your inbox.` : "Enter the OTP from your email"}
      />
      <div className="px-6 pb-7 pt-5">
        <EmailBadge email={email} />
        <p className="text-xs mb-6 leading-relaxed text-center" style={{ color: "var(--color-text-tertiary)" }}>
          Enter the <strong style={{ color: "var(--color-text-secondary)" }}>6-digit OTP</strong> we sent.
          Check your spam folder if you don&apos;t see it.
        </p>
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <OtpInput
              value={otp}
              onChange={(v) => { setOtp(v); setError(""); }}
              error={!!error}
              disabled={loading}
            />
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
              Back to sign up
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}

// ─── Duplicate email modal ────────────────────────────────────

function DuplicateEmailAlert({
  email,
  onLogin,
  onBack,
}: {
  email: string;
  onLogin: () => void;
  onBack: () => void;
}) {
  return (
    <Panel>
      <div className="p-8 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border-2"
          style={{ background: "var(--color-warning-bg, #fef3c7)", borderColor: "var(--color-warning, #F59E0B)" }}
        >
          <FaEnvelope className="w-6 h-6" style={{ color: "var(--color-warning, #F59E0B)" }} />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Account Already Exists
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-tertiary)" }}>
          An account is registered with:
        </p>
        <div
          className="px-4 py-2.5 rounded-xl mb-6 text-sm font-bold break-all"
          style={{ background: "var(--color-warning-bg, #fef3c7)", color: "var(--color-warning, #F59E0B)" }}
        >
          {email}
        </div>
        <div className="space-y-2">
          <SubmitButton loading={false} loadingText="" onClick={onLogin} type="button">
            <FaEnvelope className="w-3.5 h-3.5" /> Sign In Instead
          </SubmitButton>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Use a Different Email
          </button>
        </div>
      </div>
    </Panel>
  );
}

// ─── Register form ────────────────────────────────────────────

type View = "register" | "verify" | "duplicate";

interface VerifyData { email: string; username: string; }

function RegisterForm() {
  const router = useRouter();
  const [view, setView] = useState<View>("register");
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = registerSchema.safeParse({
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      confirmPassword: password.trim(),
      dob,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue: { path: PropertyKey[]; message: string }) => {
        const field = String(issue.path[0]);
        if (field && field !== "confirmPassword") errs[field] = issue.message;
      });
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }

    setLoading(true);
    try {
      await authService.register({
        email: result.data!.email,
        password: result.data!.password,
        username: result.data!.username,
        dob: result.data!.dob,
      });
      setVerifyData({ email: result.data!.email, username: result.data!.username });
      setView("verify");
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Registration failed.";
      if (/already|duplicate/i.test(msg)) {
        setDuplicateEmail(email.trim().toLowerCase());
        setErrors({ email: "This email is already registered." });
        setView("duplicate");
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {view === "verify" && verifyData && (
        <VerifyOTPStep
          key="verify"
          email={verifyData.email}
          username={verifyData.username}
          onVerified={() => router.push("/login")}
          onBack={() => { setView("register"); setVerifyData(null); }}
        />
      )}
      {view === "duplicate" && duplicateEmail && (
        <DuplicateEmailAlert
          key="duplicate"
          email={duplicateEmail}
          onLogin={() => router.push("/login")}
          onBack={() => { setView("register"); setDuplicateEmail(null); setEmail(""); setErrors({}); }}
        />
      )}
      {view === "register" && (
        <Panel key="register">
          <ShimmerStyle />
          <PanelHeader
            icon={<FaUser size={14} />}
            title={<>Join <span style={{ color: "var(--color-accent-primary)" }}>WeCinema</span></>}
            subtitle="Create your account"
          />
          <div className="px-6 pb-7 pt-5">
            {errors.general && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl text-sm mb-4"
                style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)" }}>
                <AlertCircle size={14} className="flex-shrink-0" />{errors.general}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Username" error={errors.username} delay={0.05}>
                <InputWithIcon icon={<FaUser className="w-3.5 h-3.5" />}
                  type="text" value={username} placeholder="Choose a username"
                  error={!!errors.username} required minLength={3}
                  onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="Email Address" error={errors.email} delay={0.08}>
                <InputWithIcon icon={<FaEnvelope className="w-3.5 h-3.5" />}
                  type="email" value={email} placeholder="you@example.com"
                  error={!!errors.email} required
                  onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password" error={errors.password} delay={0.11}>
                <InputWithIcon icon={<FaLock className="w-3.5 h-3.5" />}
                  type="password" value={password} placeholder="Min. 6 characters"
                  error={!!errors.password} required minLength={6}
                  onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field label="Date of Birth" error={errors.dob} delay={0.14}>
                <InputWithIcon icon={<FaCalendarAlt className="w-3.5 h-3.5" />}
                  type="date" value={dob} error={!!errors.dob} required
                  onChange={(e) => setDob(e.target.value)} />
                <p className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                  You must be at least 13 years old
                </p>
              </Field>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.17 }}
                className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{
                  background: "color-mix(in srgb, var(--color-accent-primary) 8%, var(--color-bg-secondary))",
                  border: "1px solid color-mix(in srgb, var(--color-accent-primary) 22%, transparent)",
                }}
              >
                <input type="checkbox" id="terms" required
                  className="w-4 h-4 mt-0.5 flex-shrink-0 rounded"
                  style={{ accentColor: "var(--color-accent-primary)" }} />
                <label htmlFor="terms" className="text-xs cursor-pointer"
                  style={{ color: "var(--color-text-secondary)" }}>
                  I agree to the{" "}
                  <Link href="/terms-and-conditions" className="font-semibold underline"
                    style={{ color: "var(--color-accent-primary)" }} target="_blank">
                    Terms and Conditions
                  </Link>
                </label>
              </motion.div>

              <SubmitButton loading={loading} loadingText="Creating account…">
                Create Account <ChevronRight size={14} />
              </SubmitButton>

              <p className="text-center text-xs pt-4"
                style={{ color: "var(--color-text-tertiary)", borderTop: "1px solid var(--color-divider)" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-bold" style={{ color: "var(--color-accent-primary)" }}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </Panel>
      )}
    </AnimatePresence>
  );
}

// ─── Main export ──────────────────────────────────────────────

export function SignupForm() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--color-bg-tertiary)" }}>
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "var(--color-accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-tertiary)" }}>
      <RegisterForm />
    </div>
  );
}
