"use client";

import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { FaEnvelope, FaLock, FaTimes, FaUser } from "react-icons/fa";

// ─── Shimmer animation ────────────────────────────────────────

export function ShimmerStyle() {
  return (
    <style>{`
      @keyframes auth-shimmer {
        0%   { background-position:  200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}

// ─── Field wrapper ────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  delay?: number;
}

export function Field({ label, error, children, delay = 0 }: FieldProps) {
  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
    >
      <label
        className="block text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "var(--color-danger)" }}
        >
          <AlertCircle size={10} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </motion.div>
  );
}

// ─── Input with icon ─────────────────────────────────────────

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  error?: boolean;
}

export function InputWithIcon({ icon, error, ...props }: InputWithIconProps) {
  return (
    <div className="relative">
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: error ? "var(--color-danger)" : "var(--color-accent-primary)" }}
      >
        {icon}
      </span>
      <input
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
        style={{
          background: "var(--color-input-bg)",
          border: `1.5px solid ${error ? "var(--color-danger)" : "var(--color-input-border)"}`,
          color: "var(--color-text-primary)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-input-focus)";
          e.target.style.boxShadow =
            "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 15%, transparent)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? "var(--color-danger)"
            : "var(--color-input-border)";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
}

// ─── Submit button ────────────────────────────────────────────

interface SubmitButtonProps {
  loading: boolean;
  loadingText: string;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}

export function SubmitButton({
  loading,
  loadingText,
  children,
  disabled,
  danger = false,
  type = "submit",
  onClick,
}: SubmitButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      whileTap={{ scale: 0.98 }}
      className="relative w-full py-3 rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2 transition-opacity duration-200"
      style={{
        background: danger
          ? "linear-gradient(135deg, var(--color-danger), #DC2626)"
          : "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary, var(--color-accent-primary)))",
        color: "var(--color-button-primary-text, #000)",
        boxShadow: danger
          ? "0 4px 14px color-mix(in srgb, var(--color-danger) 30%, transparent)"
          : "0 4px 14px color-mix(in srgb, var(--color-accent-primary) 30%, transparent)",
        opacity: loading || disabled ? 0.55 : 1,
        cursor: loading || disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: loading || disabled ? "none" : "auth-shimmer 2s infinite",
        }}
      />
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ─── Email badge ──────────────────────────────────────────────

export function EmailBadge({ email }: { email: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5"
      style={{
        background:
          "color-mix(in srgb, var(--color-accent-primary) 10%, var(--color-bg-secondary))",
        border:
          "1px solid color-mix(in srgb, var(--color-accent-primary) 24%, transparent)",
      }}
    >
      <FaEnvelope
        className="flex-shrink-0 text-sm"
        style={{ color: "var(--color-accent-primary)" }}
      />
      <div>
        <p
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{
            color:
              "color-mix(in srgb, var(--color-accent-primary) 80%, var(--color-text-secondary))",
          }}
        >
          OTP sent to
        </p>
        <p className="text-sm font-bold break-all" style={{ color: "var(--color-accent-primary)" }}>
          {email}
        </p>
      </div>
    </div>
  );
}

// ─── Google Sign-In button ────────────────────────────────────

interface GoogleSignInButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
  /** "default" = neutral bordered style (canonical pages, Explore). "gold" = HypeMode amber accent. */
  variant?: "default" | "gold";
}

export function GoogleSignInButton({
  loading,
  onClick,
  label = "Continue with Google",
  variant = "default",
}: GoogleSignInButtonProps) {
  const gold = variant === "gold";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 outline-none"
      style={{
        background: gold ? "var(--color-bg-tertiary)" : "var(--color-bg-secondary, #fff)",
        border: gold ? "1.5px solid var(--color-border-secondary)" : "1.5px solid var(--color-border-secondary)",
        color: "var(--color-text-primary)",
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: gold ? "none" : "0 1px 4px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={e => { if (!loading && !gold) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { if (!gold) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Signing in…" : label}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "var(--color-divider)" }} />
      <span className="text-[11px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>or</span>
      <div className="flex-1 h-px" style={{ background: "var(--color-divider)" }} />
    </div>
  );
}

// ─── Full-screen loading spinner (auth pages: loading state + Suspense fallback) ──

export function FullScreenSpinner() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "var(--color-bg-tertiary)" }}
    >
      <div
        className="w-10 h-10 rounded-full border-[3px] animate-spin"
        style={{ borderColor: "var(--color-accent-primary)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

// Re-export icons used across auth forms
export { FaEnvelope, FaLock, FaTimes, FaUser };
