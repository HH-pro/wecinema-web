"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { authUser, applyLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doorsOpen, setDoorsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDoorsOpen(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authUser?.isAdmin) router.replace("/admin/dashboard");
  }, [authUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: { _id: string; username: string; email: string; isAdmin: boolean; isSubAdmin: boolean; avatar?: string; isVerified: boolean; hasPaid: boolean } }>(
        "/user/admin/login",
        { email, password }
      );
      applyLogin({ token: res.token, user: res.user as never });
      router.replace("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ap-bg)] flex items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `
          linear-gradient(rgba(124, 58, 237, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124, 58, 237, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Door animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full bg-[var(--ap-surface)] z-20"
          initial={{ x: 0 }}
          animate={{ x: doorsOpen ? "-100%" : 0 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          style={{ borderRight: "1px solid rgba(124, 58, 237, 0.3)" }}
        />
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-full bg-[var(--ap-surface)] z-20"
          initial={{ x: 0 }}
          animate={{ x: doorsOpen ? "100%" : 0 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          style={{ borderLeft: "1px solid rgba(124, 58, 237, 0.3)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400" />

          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, delay: 2 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-[var(--ap-text)] font-mono tracking-wider">ADMIN PORTAL</h1>
              <p className="text-xs text-[var(--ap-text-3)] font-mono mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                Secure access protocol initialized
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm font-mono"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5 tracking-wider">
                  ADMIN IDENTITY
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wecinema.co"
                  required
                  className="w-full px-4 py-3 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5 tracking-wider">
                  ACCESS KEY
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-12 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] font-mono text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ap-text-3)] hover:text-[var(--ap-text-2)] transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    INITIALIZING...
                  </>
                ) : (
                  "AUTHENTICATE"
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-xs text-[var(--ap-text-3)] hover:text-purple-400 font-mono transition-colors">
                ← Return to public interface
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
