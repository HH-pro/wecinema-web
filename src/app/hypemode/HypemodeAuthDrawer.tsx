"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { FaCrown } from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/features/auth/context/AuthContext";
import * as authService from "@/features/auth/services/authService";
import { AppError } from "@/features/auth/services/apiClient";
import { GoogleSignInButton, OrDivider } from "@/components/auth/shared";

/**
 * Lightweight "sign in to continue" prompt used mid-video (likes, comments,
 * follows) so the user doesn't lose their place. Deliberately does NOT
 * re-implement the login/signup forms — the canonical /login and /signup
 * pages (with Google + email/password) are the single source of truth;
 * this drawer offers a fast Google path plus links to those pages with a
 * `redirect` back to the current page.
 */

type Tab = "login" | "signup";

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

function ShimmerStyle() {
  return (
    <style>{`
      @keyframes hm-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    `}</style>
  );
}

interface HypemodeAuthDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export function HypemodeAuthDrawer({ open, onClose, defaultTab = "login" }: HypemodeAuthDrawerProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { applyLogin } = useAuth();
  const pathname = usePathname();
  const redirectTarget = encodeURIComponent(pathname || "/");

  const handleGoogleSignIn = useCallback(async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await authService.loginWithGoogle();
      applyLogin(res);
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError(err instanceof AppError ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }, [applyLogin, onClose]);

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
                <p className="font-black text-sm" style={{ color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                  Hype<span style={{ color: "#F59E0B" }}>Mode</span>
                </p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--color-text-tertiary)", background: "var(--color-bg-tertiary)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-danger)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"; }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pt-5 pb-8 flex flex-col gap-4">
                {/* Tab toggle — cosmetic framing only, both paths below are identical */}
                <div className="relative flex rounded-xl p-1"
                  style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-secondary)" }}>
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-lg"
                    animate={{ left: tab === "login" ? "4px" : "50%", right: tab === "login" ? "50%" : "4px" }}
                    transition={{ type: "spring", damping: 24, stiffness: 300 }}
                    style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }}
                  />
                  {(["login", "signup"] as Tab[]).map(t => (
                    <button key={t} type="button"
                      onClick={() => setTab(t)}
                      className="relative z-10 flex-1 py-2 text-sm font-bold rounded-lg transition-colors duration-200"
                      style={{ color: tab === t ? "#000" : "var(--color-text-tertiary)" }}>
                      {t === "login" ? "Sign In" : "Join Free"}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
                  {tab === "login" ? "Sign in to continue watching." : "Create a free account to join in."}
                </p>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                    style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid color-mix(in srgb,var(--color-danger) 28%,transparent)" }}>
                    <AlertCircle size={12} className="flex-shrink-0" />{error}
                  </div>
                )}

                <GoogleSignInButton variant="gold" loading={googleLoading} onClick={handleGoogleSignIn} />
                <OrDivider />

                <Link
                  href={`/login?redirect=${redirectTarget}`}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B,#D97706)", color: "#000" }}
                >
                  Sign in with email
                </Link>
                <Link
                  href={`/signup?redirect=${redirectTarget}`}
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center"
                  style={{ background: "transparent", color: "#F59E0B", border: "1.5px solid rgba(245,158,11,0.5)" }}
                >
                  Create free account
                </Link>
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
