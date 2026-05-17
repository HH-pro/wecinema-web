"use client";

import {
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  Loader2,
  Mail,
  AlertCircle,
  X,
} from "lucide-react";
import { FaCrown, FaEnvelope, FaLock, FaCalendarAlt, FaUser } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/context/AuthContext";
import * as userService from "@/features/auth/services/authService";
import { AppError } from "@/features/auth/services/apiClient";

// ─── Google Sign-In Button (drawer-specific gold style) ───────

function GoogleBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-150 outline-none"
      style={{
        background: "var(--color-bg-tertiary)",
        border: "1.5px solid var(--color-border-secondary)",
        color: "var(--color-text-primary)",
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: "var(--color-divider)" }} />
      <span className="text-[11px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>or</span>
      <div className="flex-1 h-px" style={{ background: "var(--color-divider)" }} />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────

type Tab = "login" | "signup";
type View = "tabs" | "verify" | "forgot1" | "forgot2" | "success";

// ─── Validators ───────────────────────────────────────────────

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
function validateAge(dob: string): string | null {
  if (!dob) return "Date of birth is required";
  const diff = new Date().getFullYear() - new Date(dob).getFullYear();
  if (diff < 13) return "You must be at least 13 years old";
  if (diff > 120) return "Enter a valid date of birth";
  return null;
}
function formatDob(dob: string) {
  return new Date(dob).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// ─── Animation variants ───────────────────────────────────────

const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 28, stiffness: 260, mass: 0.8 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.22 } },
};

const contentVariants = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 26, stiffness: 320 } },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0, transition: { duration: 0.15 } }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.055, duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// ─── Shimmer ──────────────────────────────────────────────────

function ShimmerStyle() {
  return (
    <style>{`
      @keyframes hm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes hm-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
      @keyframes hm-spin { to{transform:rotate(360deg)} }
      @keyframes hm-pop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
      @keyframes hm-particles {
        0%   { opacity:1; transform: scale(1) translate(0,0); }
        100% { opacity:0; transform: scale(0) translate(var(--tx),var(--ty)); }
      }
      .hm-shake { animation: hm-shake 0.4s ease; }
    `}</style>
  );
}

// ─── Field ────────────────────────────────────────────────────

function Field({
  label, error, children, index = 0,
}: {
  label: string; error?: string; children: ReactNode; index?: number;
}) {
  return (
    <motion.div custom={index} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
      <label className="block text-[10px] font-semibold tracking-[0.1em] uppercase"
        style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--color-danger)" }}
          >
            <AlertCircle size={10} className="flex-shrink-0" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  hasError?: boolean;
}

function AuthInput({ icon, hasError, ...props }: InputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: hasError ? "var(--color-danger)" : "var(--color-accent-primary)" }}>
        {icon}
      </span>
      <input
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
        style={{
          background: "var(--color-input-bg)",
          border: `1.5px solid ${hasError ? "var(--color-danger)" : "var(--color-input-border)"}`,
          color: "var(--color-text-primary)",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={e => {
          e.target.style.borderColor = hasError ? "var(--color-danger)" : "var(--color-accent-primary)";
          e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb,var(--color-accent-primary) 18%,transparent)";
        }}
        onBlur={e => {
          e.target.style.borderColor = hasError ? "var(--color-danger)" : "var(--color-input-border)";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
}

// ─── Gold button ──────────────────────────────────────────────

function GoldButton({
  loading, loadingText, children, disabled, onClick, type = "submit",
}: {
  loading: boolean; loadingText: string; children: ReactNode;
  disabled?: boolean; onClick?: () => void; type?: "submit" | "button";
}) {
  return (
    <motion.button
      type={type} onClick={onClick}
      disabled={loading || disabled}
      whileHover={loading || disabled ? {} : { scale: 1.015, boxShadow: "0 6px 24px rgba(245,158,11,0.45)" }}
      whileTap={loading || disabled ? {} : { scale: 0.97 }}
      className="relative w-full py-3 rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2"
      style={{
        background: "linear-gradient(135deg,#FBBF24,#F59E0B,#D97706)",
        color: "#000",
        boxShadow: "0 4px 18px rgba(245,158,11,0.32)",
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? "not-allowed" : "pointer",
      }}
    >
      <span className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.22) 50%,transparent 60%)",
          backgroundSize: "200% 100%",
          animation: loading || disabled ? "none" : "hm-shimmer 2.2s infinite",
        }} />
      {loading
        ? <><Loader2 size={14} className="animate-spin" />{loadingText}</>
        : children}
    </motion.button>
  );
}

// ─── OTP Input ────────────────────────────────────────────────

function OtpGrid({ value, onChange, error, disabled }: {
  value: string; onChange: (v: string) => void; error?: boolean; disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[i]) { arr[i] = ""; } else if (i > 0) { arr[i - 1] = ""; refs.current[i - 1]?.focus(); }
      onChange(arr.join(""));
    }
  };
  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = d || " ";
    onChange(arr.join("").trimEnd().replace(/ /g, ""));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p) { onChange(p); refs.current[Math.min(p.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => value[i] ?? "").map((digit, i) => (
        <motion.input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={digit} disabled={disabled}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          autoFocus={i === 0}
          animate={digit ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.18 }}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none"
          style={{
            background: digit
              ? "color-mix(in srgb,var(--color-accent-primary) 14%,var(--color-input-bg))"
              : "var(--color-input-bg)",
            border: `2px solid ${digit ? "var(--color-accent-primary)" : error ? "var(--color-danger)" : "var(--color-input-border)"}`,
            color: digit ? "var(--color-accent-primary)" : "var(--color-text-primary)",
            boxShadow: digit ? "0 0 0 3px color-mix(in srgb,var(--color-accent-primary) 18%,transparent)" : "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────

function LoginForm({ onVerify, onForgot, onGoogleSuccess }: {
  onVerify: (email: string) => void;
  onForgot: () => void;
  onGoogleSuccess: () => void;
}) {
  const { applyLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      const res = await userService.loginWithGoogle();
      applyLogin(res);
      router.refresh();
      onGoogleSuccess();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setErrors({ general: err instanceof AppError ? err.message : "Google sign-in failed. Please try again." });
      triggerShake();
    } finally { setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    if (Object.keys(errs).length) { setErrors(errs); triggerShake(); return; }
    setLoading(true);
    try {
      const res = await userService.login({ email: email.trim().toLowerCase(), password });
      applyLogin(res);
      router.refresh();
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Login failed";
      if (/verif/i.test(msg) || (err instanceof AppError && err.status === 403)) {
        onVerify(email.trim().toLowerCase());
      } else {
        setErrors({ general: msg });
        triggerShake();
      }
    } finally { setLoading(false); }
  };

  return (
    <div className={shake ? "hm-shake" : ""}>
      <GoogleBtn loading={googleLoading} onClick={handleGoogleSignIn} />
      <OrDivider />
      {errors.general && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium mb-4"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb,var(--color-danger) 28%,transparent)" }}>
          <AlertCircle size={12} className="flex-shrink-0" />{errors.general}
        </motion.div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" error={errors.email} index={0}>
        <AuthInput icon={<FaEnvelope size={13} />} type="email" value={email}
          placeholder="you@example.com" hasError={!!errors.email} required
          onChange={e => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" error={errors.password} index={1}>
        <AuthInput icon={<FaLock size={13} />} type="password" value={password}
          placeholder="••••••••" hasError={!!errors.password} required
          onChange={e => setPassword(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <button type="button" onClick={onForgot}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--color-accent-primary)" }}>
          Forgot password?
        </button>
      </div>
      <GoldButton loading={loading} loadingText="Signing in…">
        Sign In <ChevronRight size={14} />
      </GoldButton>
    </form>
  </div>
  );
}

// ─── Signup form ──────────────────────────────────────────────

function SignupForm({ onVerify, onGoogleSuccess }: {
  onVerify: (email: string, username: string) => void;
  onGoogleSuccess: () => void;
}) {
  const { applyLogin } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      const res = await userService.loginWithGoogle();
      applyLogin(res);
      router.refresh();
      onGoogleSuccess();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setErrors({ general: err instanceof AppError ? err.message : "Google sign-in failed. Please try again." });
      triggerShake();
    } finally { setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs: Record<string, string> = {};
    if (username.trim().length < 3) errs.username = "Min. 3 characters";
    if (!isValidEmail(email)) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "Min. 6 characters";
    const ageErr = validateAge(dob);
    if (ageErr) errs.dob = ageErr;
    if (Object.keys(errs).length) { setErrors(errs); triggerShake(); return; }
    setLoading(true);
    try {
      await userService.register({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        username: username.trim(),
        dob: formatDob(dob),
      });
      onVerify(email.trim().toLowerCase(), username.trim());
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Registration failed";
      if (/already|duplicate/i.test(msg)) setErrors({ email: "Email already registered" });
      else setErrors({ general: msg });
      triggerShake();
    } finally { setLoading(false); }
  };

  return (
    <div className={shake ? "hm-shake" : ""}>
      <GoogleBtn loading={googleLoading} onClick={handleGoogleSignIn} />
      <OrDivider />
      {errors.general && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium mb-3"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb,var(--color-danger) 28%,transparent)" }}>
          <AlertCircle size={12} className="flex-shrink-0" />{errors.general}
        </motion.div>
      )}
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <Field label="Username" error={errors.username} index={0}>
        <AuthInput icon={<FaUser size={13} />} type="text" value={username}
          placeholder="Choose a username" hasError={!!errors.username} required minLength={3}
          onChange={e => setUsername(e.target.value)} />
      </Field>
      <Field label="Email" error={errors.email} index={1}>
        <AuthInput icon={<FaEnvelope size={13} />} type="email" value={email}
          placeholder="you@example.com" hasError={!!errors.email} required
          onChange={e => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" error={errors.password} index={2}>
        <AuthInput icon={<FaLock size={13} />} type="password" value={password}
          placeholder="Min. 6 characters" hasError={!!errors.password} required minLength={6}
          onChange={e => setPassword(e.target.value)} />
      </Field>
      <Field label="Date of Birth" error={errors.dob} index={3}>
        <AuthInput icon={<FaCalendarAlt size={13} />} type="date" value={dob}
          hasError={!!errors.dob} required onChange={e => setDob(e.target.value)} />
      </Field>
      <motion.label
        custom={4} variants={fieldVariants} initial="hidden" animate="visible"
        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
        style={{ background: "color-mix(in srgb,var(--color-accent-primary) 7%,var(--color-bg-elevated))", border: "1px solid color-mix(in srgb,var(--color-accent-primary) 20%,transparent)" }}>
        <input type="checkbox" required className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
          style={{ accentColor: "var(--color-accent-primary)" }} />
        <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
          I agree to the{" "}
          <span className="font-semibold underline" style={{ color: "var(--color-accent-primary)" }}>
            Terms & Conditions
          </span>
        </span>
      </motion.label>
      <GoldButton loading={loading} loadingText="Creating account…">
        Create Account <ChevronRight size={14} />
      </GoldButton>
    </form>
  </div>
  );
}

// ─── OTP Verify view ─────────────────────────────────────────

function VerifyView({
  email, username, context, onSuccess, onBack,
}: {
  email: string; username?: string; context: "register" | "login";
  onSuccess: () => void; onBack: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      await userService.verifyEmailOtp({ email, otp });
      onSuccess();
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Verification failed");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try { await userService.resendVerification(email); setOtp(""); setError(""); } catch {}
    finally { setResending(false); }
  };

  return (
    <motion.div key="verify" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
      {/* Email badge */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5"
        style={{ background: "color-mix(in srgb,var(--color-accent-primary) 10%,var(--color-bg-elevated))", border: "1px solid color-mix(in srgb,var(--color-accent-primary) 22%,transparent)" }}>
        <Mail size={14} style={{ color: "var(--color-accent-primary)", flexShrink: 0 }} />
        <div>
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "var(--color-accent-primary)" }}>OTP sent to</p>
          <p className="text-sm font-bold break-all" style={{ color: "var(--color-accent-primary)" }}>{email}</p>
        </div>
      </div>

      <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
        Enter the <strong style={{ color: "var(--color-text-secondary)" }}>6-digit OTP</strong> from your inbox.
        Check spam if you don&apos;t see it.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <OtpGrid value={otp} onChange={v => { setOtp(v); setError(""); }} error={!!error} disabled={loading} />
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs justify-center" style={{ color: "var(--color-danger)" }}>
                <AlertCircle size={10} />{error}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-[10px] text-center" style={{ color: "var(--color-text-tertiary)" }}>
            Expires in 15 minutes
          </p>
        </div>
        <GoldButton loading={loading} loadingText="Verifying…">
          <CheckCircle size={14} /> Verify Email
        </GoldButton>
        <div className="flex justify-between text-xs">
          <button type="button" onClick={handleResend} disabled={resending}
            className="font-medium disabled:opacity-40" style={{ color: "var(--color-accent-primary)" }}>
            {resending ? "Sending…" : "Resend OTP"}
          </button>
          <button type="button" onClick={onBack} style={{ color: "var(--color-text-tertiary)" }}>
            ← Back
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Forgot password view ─────────────────────────────────────

function ForgotView({ onBack, onLoginSuccess }: { onBack: () => void; onLoginSuccess: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setErrors({ email: "Enter a valid email" }); return; }
    setLoading(true);
    try {
      await userService.forgotPassword(email.trim().toLowerCase());
      setStep(2);
    } catch (err) {
      setErrors({ email: err instanceof AppError ? err.message : "Something went wrong" });
    } finally { setLoading(false); }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (otp.length !== 6) errs.otp = "Enter all 6 digits";
    if (newPassword.length < 6) errs.password = "Min. 6 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await userService.resetPassword({ email, otp: otp.trim(), newPassword });
      onLoginSuccess();
    } catch (err) {
      const msg = err instanceof AppError ? err.message : "Something went wrong";
      if (/otp|invalid|expired/i.test(msg)) setErrors({ otp: msg });
      else setErrors({ password: msg });
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try { await userService.forgotPassword(email); setOtp(""); } catch {}
    finally { setResending(false); }
  };

  if (step === 2) {
    return (
      <motion.div key="fp2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4"
          style={{ background: "color-mix(in srgb,var(--color-accent-primary) 10%,var(--color-bg-elevated))", border: "1px solid color-mix(in srgb,var(--color-accent-primary) 22%,transparent)" }}>
          <Mail size={14} style={{ color: "var(--color-accent-primary)" }} />
          <p className="text-sm font-bold break-all" style={{ color: "var(--color-accent-primary)" }}>{email}</p>
        </div>
        <form onSubmit={handleStep2} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--color-text-tertiary)" }}>
              6-Digit OTP
            </label>
            <OtpGrid value={otp} onChange={v => { setOtp(v); setErrors(p => ({ ...p, otp: "" })); }}
              error={!!errors.otp} disabled={loading} />
            {errors.otp && (
              <p className="flex items-center gap-1 text-xs justify-center" style={{ color: "var(--color-danger)" }}>
                <AlertCircle size={10} />{errors.otp}
              </p>
            )}
          </div>
          <Field label="New Password" error={errors.password} index={0}>
            <AuthInput icon={<FaLock size={13} />} type="password" value={newPassword}
              placeholder="Min. 6 characters" hasError={!!errors.password} required minLength={6}
              onChange={e => setNewPassword(e.target.value)} />
          </Field>
          <GoldButton loading={loading} loadingText="Resetting…">Reset Password</GoldButton>
          <div className="flex justify-between text-xs">
            <button type="button" onClick={handleResend} disabled={resending}
              className="font-medium disabled:opacity-40" style={{ color: "var(--color-accent-primary)" }}>
              {resending ? "Sending…" : "Resend OTP"}
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ color: "var(--color-text-tertiary)" }}>
              ← Back
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div key="fp1" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}>
      <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
        Enter your email and we&apos;ll send you a 6-digit OTP to reset your password.
      </p>
      <form onSubmit={handleStep1} className="space-y-4">
        <Field label="Email" error={errors.email} index={0}>
          <AuthInput icon={<FaEnvelope size={13} />} type="email" value={email}
            placeholder="you@example.com" hasError={!!errors.email} required
            onChange={e => setEmail(e.target.value)} />
        </Field>
        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg,var(--color-info,#3B82F6),#2563EB)",
            opacity: loading ? 0.6 : 1,
          }}>
          {loading ? <><Loader2 size={14} className="animate-spin" />Sending…</> : <><Mail size={14} />Send OTP</>}
        </motion.button>
        <div className="text-center">
          <button type="button" onClick={onBack} className="text-xs font-medium"
            style={{ color: "var(--color-text-tertiary)" }}>
            ← Back to sign in
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Success view ────────────────────────────────────────────

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 260, delay: 0.1 }}
        className="relative w-20 h-20 flex items-center justify-center rounded-full mb-5"
        style={{ background: "radial-gradient(circle,rgba(245,158,11,0.18) 0%,transparent 70%)", border: "2px solid var(--color-accent-primary)" }}
      >
        <CheckCircle size={36} style={{ color: "var(--color-accent-primary)" }} />
        {/* Particle dots */}
        {[...Array(8)].map((_, i) => (
          <span key={i} className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--color-accent-primary)",
              top: "50%", left: "50%",
              "--tx": `${Math.cos((i / 8) * Math.PI * 2) * 40}px`,
              "--ty": `${Math.sin((i / 8) * Math.PI * 2) * 40}px`,
              animation: `hm-particles 0.6s ${i * 0.06}s ease-out forwards`,
            } as React.CSSProperties}
          />
        ))}
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="text-xl font-black mb-2" style={{ color: "var(--color-text-primary)" }}>
        Welcome to WeCinema!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
        You&apos;re signed in. Enjoy HypeMode content.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className="px-8 py-2.5 rounded-xl font-bold text-sm"
        style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)", color: "#000" }}>
        <FaCrown style={{ display: "inline", marginRight: 6 }} size={12} />
        Explore HypeMode
      </motion.button>
    </motion.div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────

interface HypemodeAuthDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export function HypemodeAuthDrawer({ open, onClose, defaultTab = "login" }: HypemodeAuthDrawerProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [direction, setDirection] = useState(0);
  const [view, setView] = useState<View>("tabs");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyUsername, setVerifyUsername] = useState("");
  const [verifyContext, setVerifyContext] = useState<"register" | "login">("login");

  const switchTab = useCallback((next: Tab) => {
    setDirection(next === "signup" ? 1 : -1);
    setTab(next);
    setView("tabs");
  }, []);

  const handleLoginVerify = (email: string) => {
    setVerifyEmail(email);
    setVerifyContext("login");
    setView("verify");
  };

  const handleSignupVerify = (email: string, username: string) => {
    setVerifyEmail(email);
    setVerifyUsername(username);
    setVerifyContext("register");
    setView("verify");
  };

  const handleVerifySuccess = () => {
    if (verifyContext === "register") setView("success");
    else { setView("tabs"); }
  };

  const handleForgotSuccess = () => {
    setView("tabs");
    setTab("login");
  };

  const getTitle = () => {
    if (view === "verify") return "Verify Email";
    if (view === "forgot1" || view === "forgot2") return "Reset Password";
    if (view === "success") return "";
    return null;
  };

  const subTitle = getTitle();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            variants={drawerVariants}
            initial="hidden" animate="visible" exit="exit"
            className="fixed right-0 top-0 bottom-0 z-[201] flex flex-col"
            style={{
              width: "min(440px, 100vw)",
              background: "var(--color-bg-elevated)",
              borderLeft: "1px solid var(--color-card-border)",
              boxShadow: "-8px 0 60px rgba(0,0,0,0.28)",
              overflow: "hidden",
            }}
          >
            <ShimmerStyle />

            {/* ── Amber glow strip ── */}
            <div style={{ height: 3, background: "linear-gradient(90deg,#FBBF24,#F59E0B,#D97706,#F59E0B,#FBBF24)", backgroundSize: "200% 100%", animation: "hm-shimmer 3s linear infinite" }} />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: "1px solid var(--color-divider)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)", boxShadow: "0 4px 12px rgba(245,158,11,0.4)" }}>
                  <FaCrown size={14} color="#fff" />
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                    Hype<span style={{ color: "#F59E0B" }}>Mode</span>
                  </p>
                  {subTitle && (
                    <p className="text-[11px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                      {subTitle}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--color-text-tertiary)", background: "var(--color-bg-tertiary)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-danger)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"; }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pt-5 pb-8">
                <AnimatePresence mode="wait">
                  {/* ── Verify OTP ── */}
                  {view === "verify" && (
                    <VerifyView
                      key="verify"
                      email={verifyEmail}
                      username={verifyUsername}
                      context={verifyContext}
                      onSuccess={handleVerifySuccess}
                      onBack={() => setView("tabs")}
                    />
                  )}

                  {/* ── Forgot password ── */}
                  {(view === "forgot1" || view === "forgot2") && (
                    <ForgotView
                      key="forgot"
                      onBack={() => setView("tabs")}
                      onLoginSuccess={handleForgotSuccess}
                    />
                  )}

                  {/* ── Success ── */}
                  {view === "success" && (
                    <SuccessView key="success" onClose={onClose} />
                  )}

                  {/* ── Login / Signup tabs ── */}
                  {view === "tabs" && (
                    <motion.div key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Tab switcher */}
                      <div className="relative flex rounded-xl p-1 mb-6"
                        style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-secondary)" }}>
                        {/* Sliding indicator */}
                        <motion.div
                          className="absolute top-1 bottom-1 rounded-lg"
                          animate={{ left: tab === "login" ? "4px" : "50%", right: tab === "login" ? "50%" : "4px" }}
                          transition={{ type: "spring", damping: 24, stiffness: 300 }}
                          style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
                        />
                        {(["login", "signup"] as Tab[]).map(t => (
                          <button key={t} type="button"
                            onClick={() => switchTab(t)}
                            className="relative z-10 flex-1 py-2 text-sm font-bold rounded-lg transition-colors duration-200"
                            style={{ color: tab === t ? "#000" : "var(--color-text-tertiary)" }}>
                            {t === "login" ? "Sign In" : "Join Free"}
                          </button>
                        ))}
                      </div>

                      {/* Tab content with slide animation */}
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={tab}
                          custom={direction}
                          variants={contentVariants}
                          initial="enter" animate="center" exit="exit"
                        >
                          {tab === "login"
                            ? <LoginForm onVerify={handleLoginVerify} onForgot={() => setView("forgot1")} onGoogleSuccess={onClose} />
                            : <SignupForm onVerify={handleSignupVerify} onGoogleSuccess={onClose} />
                          }
                        </motion.div>
                      </AnimatePresence>

                      {/* Switch link */}
                      <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-center text-xs mt-5 pt-4"
                        style={{ color: "var(--color-text-tertiary)", borderTop: "1px solid var(--color-divider)" }}>
                        {tab === "login" ? (
                          <>Don&apos;t have an account?{" "}
                            <button type="button" onClick={() => switchTab("signup")}
                              className="font-bold" style={{ color: "var(--color-accent-primary)" }}>
                              Create Account
                            </button></>
                        ) : (
                          <>Already have an account?{" "}
                            <button type="button" onClick={() => switchTab("login")}
                              className="font-bold" style={{ color: "var(--color-accent-primary)" }}>
                              Sign In
                            </button></>
                        )}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-3 text-center" style={{ borderTop: "1px solid var(--color-divider)" }}>
              <p className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                🔒 Secure · Your data is protected
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
