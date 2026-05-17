"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from "@paypal/react-paypal-js";
import { FaCrown, FaBolt } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import * as authService from "@/features/auth/services/authService";
import { AppError, api } from "@/features/auth/services/apiClient";

// ─── Types ─────────────────────────────────────────────────────

type UserMode = "buyer" | "seller";
type PlanId = "user" | "studio";

interface SubscriptionStatus {
  hasPaid: boolean;
  isExpired: boolean;
  subscriptionType: string | null;
  userType: string | null;
}

interface CreateOrderResponse { orderId: string }
interface CaptureOrderResponse { success: boolean; message: string }

// ─── Payment API ───────────────��───────────────────────────────

async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  return api.get<SubscriptionStatus>(`/payments/status/${userId}`);
}

async function fetchPaypalClientId(): Promise<string> {
  try {
    const data = await api.get<{ paypalClientId?: string }>("/payments/config");
    return data?.paypalClientId ?? "";
  } catch { return ""; }
}

async function createOrder(planId: PlanId, userType: UserMode): Promise<string> {
  const res = await api.post<CreateOrderResponse>("/payments/create-order", { planId, userType });
  if (!res?.orderId) throw new Error("No order ID received from server");
  return res.orderId;
}

async function captureOrder(orderId: string): Promise<CaptureOrderResponse> {
  return api.post<CaptureOrderResponse>("/payments/capture-order", { orderId });
}

// ─── Static data ───────────────────────────────────────────────

const PLANS = [
  {
    id: "user" as PlanId,
    badge: "Popular",
    title: "Basic Plan",
    price: "$5/month",
    amount: 5,
    description: "Perfect for individual users",
    accentColor: "var(--color-accent-primary)",
    features: ["Buy Films & Scripts", "Sell Your Content", "Basic Support", "Access to Community", "5GB Storage"],
  },
  {
    id: "studio" as PlanId,
    badge: "Pro",
    title: "Pro Plan",
    price: "$10/month",
    amount: 10,
    description: "Advanced features for professionals",
    accentColor: "#8B5CF6",
    features: ["All Basic Features", "Early Feature Access", "Priority Support", "Team Collaboration"],
  },
];

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/popup-closed-by-user": "Sign-in cancelled.",
  "auth/cancelled-popup-request": "Sign-in cancelled.",
  "auth/email-already-in-use": "Email already in use.",
  "auth/user-not-found": "Account not found.",
};

// ─── Google SVG icon ────────��──────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.233 17.64 11.925 17.64 9.2Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── PayPal inner buttons ──────────────────────────────────────

function PayPalButtonsInner({
  userId, planId, userType, onSuccess, onError,
}: {
  userId: string; planId: PlanId; userType: UserMode;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (isPending) return <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading PayPal…</p>;
  if (isRejected) return (
    <p style={{ textAlign: "center", color: "var(--color-danger)", fontSize: 13 }}>
      Could not load PayPal. Please reload the page.
    </p>
  );
  if (err) return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 8 }}>{err}</p>
      <button
        onClick={() => setErr(null)}
        style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "var(--color-danger)", color: "#fff", fontSize: 13, cursor: "pointer" }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{ position: "relative", minHeight: 50 }}>
      {processing && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
          <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} /> Processing…
        </div>
      )}
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "pay", height: 45 }}
        disabled={processing}
        fundingSource={FUNDING.PAYPAL}
        createOrder={async () => {
          setProcessing(true);
          setErr(null);
          try {
            return await createOrder(planId, userType);
          } catch (e) {
            setProcessing(false);
            const msg = e instanceof Error ? e.message : "Failed to create order.";
            setErr(msg);
            onError(msg);
            throw e;
          }
        }}
        onApprove={async (data) => {
          try {
            if (!data.orderID) throw new Error("No order ID from PayPal");
            const result = await captureOrder(data.orderID);
            setProcessing(false);
            if (result.success) onSuccess();
            else { setErr("Payment not completed. Please try again."); onError("Payment not completed."); }
          } catch (e) {
            setProcessing(false);
            const msg = e instanceof Error ? e.message : "Payment failed.";
            setErr(msg);
            onError(msg);
          }
        }}
        onCancel={() => setProcessing(false)}
        onError={(e) => {
          setProcessing(false);
          console.error("PayPal error:", e);
          setErr("PayPal error. Please disable popup blockers and try again.");
        }}
        onClick={(_d, actions) => {
          if (!userId || processing) return actions.reject();
          return actions.resolve();
        }}
      />
    </div>
  );
}

// ─── PayPal wrapper (fetches client ID) ─────���─────────────────

function PayPalPayment({
  userId, planId, userType, onSuccess, onError, onSkip,
}: {
  userId: string; planId: PlanId; userType: UserMode;
  onSuccess: () => void; onError: (msg: string) => void; onSkip: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaypalClientId().then((id) => { setClientId(id); setLoading(false); });
  }, []);

  const plan = PLANS.find((p) => p.id === planId)!;

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{
        background: "var(--color-bg-elevated)", borderRadius: 20, padding: "28px 24px",
        border: "1px solid var(--color-border-secondary)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          Complete Subscription
        </h2>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--color-text-tertiary)" }}>{plan.title} — {plan.price}</p>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-tertiary)" }}>User type: {userType === "buyer" ? "Buyer" : "Seller"}</p>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-tertiary)" }}>Duration: 30 days</p>
        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>Total: ${plan.amount}</p>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "var(--color-text-tertiary)" }}>Secure payment powered by PayPal</p>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading payment options…</p>
        ) : !clientId ? (
          <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Payment not configured. Contact support.</p>
        ) : (
          <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture", components: "buttons" }}>
            <PayPalButtonsInner userId={userId} planId={planId} userType={userType} onSuccess={onSuccess} onError={onError} />
          </PayPalScriptProvider>
        )}

        <button
          type="button"
          onClick={onSkip}
          style={{
            marginTop: 12, width: "100%", padding: "10px 0",
            background: "transparent", border: "1px solid var(--color-border-secondary)",
            borderRadius: 12, fontSize: 13, fontWeight: 500,
            color: "var(--color-text-tertiary)", cursor: "pointer",
          }}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────

function SuccessScreen({ planId, userType }: { planId: PlanId; userType: UserMode }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", marginBottom: 20,
        background: "linear-gradient(135deg,#FBBF24,#F59E0B)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
      }}>
        <FaCrown size={32} color="#fff" />
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        Welcome to HypeMode!
      </h2>
      <p style={{ margin: "0 0 6px", fontSize: 15, color: "var(--color-text-secondary)" }}>
        {plan.title} activated — {userType === "buyer" ? "Buyer" : "Seller"} mode
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>Redirecting you home…</p>
    </div>
  );
}

// ─── Main export ──────────────���────────────────────────────────

export function ExploreContent({ appUrl: _appUrl }: { appUrl: string }) {
  const router = useRouter();
  const { authUser, isAuthenticated, applyLogin, refreshUser } = useAuth();

  const [mode, setMode] = useState<UserMode>("buyer");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [phase, setPhase] = useState<"plans" | "payment" | "success" | "already_premium">("plans");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);

  const authCheckedRef = useRef(false);

  // If already authenticated + hasPaid, show "already premium" screen
  useEffect(() => {
    if (authCheckedRef.current) return;
    if (!isAuthenticated || !authUser?._id) return;
    authCheckedRef.current = true;

    getSubscriptionStatus(authUser._id)
      .then((status) => {
        if (status.hasPaid && !status.isExpired) {
          setPhase("already_premium");
        } else if (selectedPlan && phase === "plans") {
          setPhase("payment");
        }
      })
      .catch(() => { /* treat as not paid */ });
  }, [isAuthenticated, authUser, selectedPlan, phase]);

  const handleGoogleLogin = useCallback(async () => {
    if (!selectedPlan) return;
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await authService.loginWithGoogle();
      applyLogin(res);

      const status = await getSubscriptionStatus(res.user._id).catch(() => null);
      if (status?.hasPaid && !status.isExpired) {
        setPhase("already_premium");
        return;
      }
      setPhase("payment");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      const msg = (FIREBASE_ERRORS[code]) ||
        (err instanceof AppError ? err.message : "Google sign-in failed. Please try again.");
      setErrorMsg(msg);
      setShowError(true);
    } finally {
      setGoogleLoading(false);
    }
  }, [selectedPlan, applyLogin]);

  const handlePaymentSuccess = useCallback(async () => {
    setPhase("success");
    try { await refreshUser(); } catch { /* non-critical */ }
    setTimeout(() => router.replace("/"), 2500);
  }, [router, refreshUser]);

  // ── Already premium screen ─────────────────────────────────────
  if (phase === "already_premium") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 20, background: "linear-gradient(135deg,#FFBB00,#FF6B00)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(255,187,0,0.35)" }}>
          <FaCrown size={32} color="#fff" />
        </div>
        <h2 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 900, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          You&apos;re Already on HypeMode!
        </h2>
        <p style={{ margin: "0 0 6px", fontSize: 15, color: "var(--color-text-secondary)", maxWidth: 380 }}>
          You already have an active HypeMode Premium subscription.
        </p>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "var(--color-text-tertiary)" }}>
          Enjoy exclusive content, ad-free streaming, and all premium features.
        </p>
        <button
          type="button"
          onClick={() => router.push("/hypemode")}
          style={{ padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#FFBB00,#FF6B00)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,187,0,0.3)" }}
        >
          Go to HypeMode Content
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--color-text-tertiary)", fontSize: 13, cursor: "pointer" }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // ── Payment phase ──────────────────────────────────────────────
  if (phase === "payment" && selectedPlan) {
    const userId = authUser?._id ?? "";
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", paddingTop: 40 }}>
        <PayPalPayment
          userId={userId}
          planId={selectedPlan}
          userType={mode}
          onSuccess={handlePaymentSuccess}
          onError={(msg) => { setErrorMsg(msg); setShowError(true); }}
          onSkip={() => router.replace("/")}
        />
        {showError && (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} onClick={() => setShowError(false)} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, background: "var(--color-bg-elevated)", borderRadius: 20, padding: "24px", maxWidth: 380, width: "calc(100% - 32px)", border: "1px solid var(--color-border-secondary)" }}>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16, textAlign: "center" }}>{errorMsg}</p>
              <button onClick={() => setShowError(false)} style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", background: "var(--color-accent-primary)", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Close</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Success phase ��─────────────────────────────────────────────
  if (phase === "success" && selectedPlan) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)" }}>
        <SuccessScreen planId={selectedPlan} userType={mode} />
      </div>
    );
  }

  // ── Plans phase ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", padding: "64px 24px 56px", textAlign: "center", borderBottom: "1px solid var(--color-divider)" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,187,0,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#FFBB00,#FF8C00)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(255,187,0,0.35)" }}>
          <FaCrown size={28} color="#fff" aria-hidden />
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 900, fontFamily: "var(--font-heading)", lineHeight: 1.1, color: "var(--color-text-primary)" }}>
          Hype<span style={{ color: "var(--color-accent-primary)" }}>Mode</span>
        </h1>
        <p style={{ margin: "0 auto 8px", fontSize: "clamp(0.95rem,2vw,1.1rem)", color: "var(--color-text-secondary)", maxWidth: 480, lineHeight: 1.6 }}>
          Exclusive premium content from the best creators on WeCinema.<br />Choose your plan and unlock everything.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
          <FaBolt size={11} color="var(--color-accent-primary)" aria-hidden style={{ display: "inline", marginRight: 4 }} />
          HD Streaming · Ad-Free · Marketplace Priority · Exclusive Content
        </p>
      </div>

      {/* Buyer / Seller toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "36px 24px 0" }}>
        {(["buyer", "seller"] as UserMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "8px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                border: "1.5px solid", cursor: "pointer", transition: "all 0.15s",
                borderColor: active ? "var(--color-accent-primary)" : "var(--color-border-secondary)",
                backgroundColor: active ? "var(--color-accent-primary)" : "var(--color-bg-elevated)",
                color: active ? "#000" : "var(--color-text-secondary)",
                boxShadow: active ? "0 2px 8px rgba(255,187,0,0.25)" : "none",
              }}
            >
              {m === "buyer" ? "Buyer" : "Seller"}
            </button>
          );
        })}
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", padding: "32px 24px 40px", maxWidth: 800, margin: "0 auto" }}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select ${plan.title}`}
              onClick={() => setSelectedPlan((p) => (p === plan.id ? null : plan.id))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedPlan((p) => (p === plan.id ? null : plan.id)); }}
              style={{
                position: "relative", flex: "1 1 300px", maxWidth: 360,
                backgroundColor: "var(--color-bg-elevated)", borderRadius: 20,
                padding: "24px 24px 28px", cursor: "pointer",
                border: `2px solid ${isSelected ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
                boxShadow: isSelected ? "0 4px 20px rgba(255,187,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                outline: "none",
              }}
            >
              {/* Badge */}
              <span style={{ position: "absolute", top: -13, left: 16, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", backgroundColor: plan.accentColor }}>
                {plan.badge}
              </span>

              <h3 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{plan.title}</h3>
              <p style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 900, fontFamily: "var(--font-heading)", color: "var(--color-accent-primary)" }}>{plan.price}</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-tertiary)" }}>{plan.description}</p>

              <ul style={{ margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Auth / pay CTA — shown when this plan is selected */}
              {isSelected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                  {isAuthenticated ? (
                    // Already logged in → go straight to payment
                    <button
                      type="button"
                      onClick={() => setPhase("payment")}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "100%", padding: "10px 0", borderRadius: 12, border: "none",
                        backgroundColor: "var(--color-accent-primary)", color: "#000",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Continue to Payment
                    </button>
                  ) : (
                    <>
                      {/* Google sign-in */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          width: "100%", padding: "10px 0", borderRadius: 12,
                          border: "1px solid var(--color-border-secondary)",
                          backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-secondary)",
                          fontSize: 14, fontWeight: 600, cursor: googleLoading ? "not-allowed" : "pointer",
                          opacity: googleLoading ? 0.6 : 1, transition: "background-color 0.15s",
                        }}
                      >
                        {googleLoading ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon />}
                        {googleLoading ? "Signing in…" : "Continue with Google"}
                      </button>

                      {/* Email sign-in link */}
                      <a
                        href="/login"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "100%", padding: "10px 0", borderRadius: 12, border: "none",
                          backgroundColor: "var(--color-accent-primary)", color: "#000",
                          fontSize: 14, fontWeight: 700, textDecoration: "none",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sign In with Email
                      </a>

                      <a
                        href="/signup"
                        style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)", textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Don&apos;t have an account?{" "}
                        <span style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>Sign up free</span>
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-tertiary)", padding: "0 24px 48px" }}>
        Secure payment powered by PayPal · Cancel anytime · 30-day billing cycle
      </p>

      {/* Error popup */}
      {showError && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} onClick={() => setShowError(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, background: "var(--color-bg-elevated)", borderRadius: 20, padding: "24px", maxWidth: 380, width: "calc(100% - 32px)", border: "1px solid var(--color-border-secondary)" }}>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16, textAlign: "center" }}>{errorMsg}</p>
            <button onClick={() => setShowError(false)} style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", background: "var(--color-accent-primary)", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
