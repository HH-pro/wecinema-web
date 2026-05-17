"use client";
// src/components/marketplace/seller/StripeSetupModal.tsx
import React, { useState, useEffect } from "react";
import { toast } from '@/lib/toast';
import {
  useStripeAccount,
  useStripeOnboarding,
} from '@/features/marketplace/api/stripe.service';
import * as stripeService from '@/features/marketplace/api/stripe.service';
import { useMySales }    from '@/hooks/useOrder';
import { useMyListings } from '@/hooks/useMarketplace';

// ─── Props ───────────────────────────────────────────────────

interface StripeSetupModalProps {
  show:                 boolean;
  onClose:             () => void;
  onSuccess:           () => void;
  onDisconnectSuccess?: () => void;
  stripeConnected:     boolean;
}

// ─── Spinner ─────────────────────────────────────────────────

const Spinner = ({ sm }: { sm?: boolean }) => (
  <svg
    className={`animate-spin ${sm ? "h-4 w-4" : "h-5 w-5"} text-white`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────

const StripeSetupModal: React.FC<StripeSetupModalProps> = ({
  show,
  onClose,
  onSuccess,
  onDisconnectSuccess,
  stripeConnected,
}) => {
  // ── Stripe hooks ──────────────────────────────────────────
  const account    = useStripeAccount();
  const onboarding = useStripeOnboarding();

  // ── Data hooks for disconnect checks ─────────────────────
  const { sales }   = useMySales();
  const { listings } = useMyListings();

  // ── Disconnect state ──────────────────────────────────────
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnectReason, setDisconnectReason]           = useState("");
  const [disconnectLoading, setDisconnectLoading]         = useState(false);

  // ── Derived disconnect requirements ──────────────────────
  const PENDING_STATUSES = ["pending_payment", "paid", "processing", "in_progress", "in_revision"];

  const hasPendingOrders   = (sales  ?? []).some((o: any) => PENDING_STATUSES.includes(o.status));
  const hasActiveListings  = (listings ?? []).some((l: any) => l.status === "active");
  const canDisconnect      = !hasPendingOrders && !hasActiveListings;

  // ── Reset on close ────────────────────────────────────────
  useEffect(() => {
    if (!show) {
      setShowDisconnectConfirm(false);
      setDisconnectReason("");
    } else if (stripeConnected) {
      account.refetch();
    }
  }, [show, stripeConnected]); // eslint-disable-line

  // ── Start / continue onboarding ───────────────────────────
  const handleStartSetup = async () => {
    try {
      if (account.status?.connected) {
        await onboarding.resumeOnboarding();
      } else {
        await onboarding.startOnboarding();
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : onboarding.error ?? "Failed to start Stripe setup";
      toast.error(message);
    }
  };

  // ── Disconnect ────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!disconnectReason.trim()) {
      toast.error("Please provide a reason for disconnecting");
      return;
    }

    setDisconnectLoading(true);
    try {
      await stripeService.disconnect();
      toast.success("Disconnect request submitted successfully");
      setShowDisconnectConfirm(false);
      setDisconnectReason("");
      onDisconnectSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to disconnect Stripe account");
    } finally {
      setDisconnectLoading(false);
    }
  };

  // ── Requirements list ─────────────────────────────────────
  const requirements: string[] = [
    ...(account.status?.requirements?.currentlyDue  ?? []),
    ...((account.status?.requirements as any)?.pastDue ?? []),
    ...(account.status?.requirements?.pendingVerification ?? []),
  ];

  const friendlyReq = (req: string) =>
    req
      .replace(/individual\.verification\.|company\.verification\./g, "")
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  if (!show) return null;

  // ─────────────────────────────────────────────────────────
  // MAIN CONTENT
  // ─────────────────────────────────────────────────────────

  const MainContent = () => (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
          <span className="text-xl text-white">💰</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            {stripeConnected ? "Manage Stripe Account" : "Connect Stripe Account"}
          </h3>
          <p className="text-text-secondary mt-1">
            {stripeConnected
              ? "Manage your payment settings and account information"
              : "Connect your account to start accepting payments"}
          </p>
        </div>
      </div>

      {/* Status overview */}
      {stripeConnected && !account.loading && account.status && (
        <div className="mb-6 p-4 bg-success-bg border border-success/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-success-bg rounded-lg flex items-center justify-center">
              <span className="text-success">✅</span>
            </div>
            <div>
              <h4 className="font-semibold text-success">Account Status</h4>
              <p className="text-sm text-success">
                {account.isActive ? "Ready to accept payments" : "Setup required"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              account.isActive
                ? "bg-success-bg text-success"
                : "bg-warning-bg text-warning"
            }`}
          >
            {account.isActive ? "Active" : "Action Required"}
          </span>
        </div>
      )}

      {/* Verification requirements */}
      {stripeConnected && requirements.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-text-primary mb-3">Verification Required</h4>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div key={req} className="flex items-start p-3 bg-warning-bg border border-accent/30 rounded-lg gap-3">
                <div className="w-5 h-5 bg-warning-bg rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.302 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-warning">{friendlyReq(req)}</p>
                  {req.toLowerCase().includes("document") && (
                    <p className="text-xs text-warning mt-1">Upload a clear photo of your government-issued ID</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account details */}
      {stripeConnected && account.status?.accountId && (
        <div className="mb-6">
          <h4 className="font-medium text-text-primary mb-3">Account Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-bg-secondary rounded-lg border border-border">
              <p className="text-xs text-text-tertiary">Account ID</p>
              <p className="text-sm font-medium text-text-primary">{account.status.accountId.slice(0, 8)}…</p>
            </div>
            <div className="p-3 bg-bg-secondary rounded-lg border border-border">
              <p className="text-xs text-text-tertiary">Status</p>
              <p className="text-sm font-medium text-text-primary">
                {account.isActive ? "Active" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits (not connected) */}
      {!stripeConnected && (
        <div className="mb-6">
          <h4 className="font-medium text-text-primary mb-3">Benefits of Connecting Stripe</h4>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: "💳", bg: "bg-info-bg",    textTitle: "text-info",    textBody: "text-info",    title: "Secure Payments",  body: "Bank-level security for all transactions" },
              { icon: "⚡", bg: "bg-success-bg", textTitle: "text-success", textBody: "text-success", title: "Fast Withdrawals", body: "Get paid in 1-3 business days" },
              { icon: "🛡️", bg: "bg-bg-elevated", textTitle: "text-text-primary", textBody: "text-text-secondary", title: "Protected", body: "Your earnings are safe with Stripe" },
            ].map(({ icon, bg, textTitle, textBody, title, body }) => (
              <div key={title} className={`p-4 ${bg} rounded-xl`}>
                <div className="text-2xl mb-2">{icon}</div>
                <h5 className={`font-medium ${textTitle} mb-1`}>{title}</h5>
                <p className={`text-sm ${textBody}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
        {!stripeConnected ? (
          <>
            <button
              onClick={handleStartSetup}
              disabled={onboarding.loading || account.loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {onboarding.loading ? <><Spinner />Connecting…</> : <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect Stripe Account
              </>}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 text-text-secondary font-medium border border-border rounded-xl hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Complete verification */}
              {(!account.isActive || requirements.length > 0) && (
                <button
                  onClick={handleStartSetup}
                  disabled={onboarding.loading}
                  className="flex-1 px-6 py-3 bg-accent hover:bg-accent-hover text-btn-primary-text font-medium rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {onboarding.loading ? <><Spinner />Loading…</> : <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {account.isActive ? "Update Account" : "Complete Setup"}
                  </>}
                </button>
              )}

              {/* Open Stripe dashboard */}
              <button
                onClick={onboarding.openStripeDashboard}
                disabled={onboarding.loading}
                className="flex-1 px-6 py-3 bg-card-bg hover:bg-bg-secondary text-text-secondary border border-border font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Stripe Dashboard
              </button>

              {/* Disconnect */}
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="flex-1 px-6 py-3 bg-card-bg hover:bg-danger-bg text-danger border border-danger/30 font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect Account
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 text-text-secondary font-medium border border-border rounded-xl hover:bg-bg-secondary transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // DISCONNECT CONFIRM CONTENT
  // ─────────────────────────────────────────────────────────

  const DisconnectContent = () => (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.302 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary">Disconnect Stripe Account</h3>
          <p className="text-text-secondary mt-1">This action requires manual review</p>
        </div>
      </div>

      {/* Warning */}
      <div className="p-4 bg-danger-bg border border-danger/30 rounded-xl mb-4">
        <h4 className="font-medium text-danger mb-2">⚠️ Important Notice</h4>
        <ul className="text-sm text-danger space-y-1">
          <li>• You will not be able to receive payments</li>
          <li>• Pending orders must be completed first</li>
          <li>• Active listings will be deactivated</li>
          <li>• Re-connecting requires full verification</li>
        </ul>
      </div>

      {/* Cannot disconnect reasons */}
      {!canDisconnect && (
        <div className="p-4 bg-warning-bg border border-accent/30 rounded-xl mb-4">
          <h4 className="font-medium text-warning mb-2">Cannot Disconnect Yet</h4>
          <div className="space-y-2">
            {hasPendingOrders && (
              <p className="flex items-center gap-2 text-sm text-warning">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                You have pending orders
              </p>
            )}
            {hasActiveListings && (
              <p className="flex items-center gap-2 text-sm text-warning">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                You have active listings
              </p>
            )}
          </div>
          <p className="text-xs text-warning mt-3">Resolve these issues before disconnecting.</p>
        </div>
      )}

      {/* Reason textarea */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">Reason for disconnecting</label>
        <textarea
          value={disconnectReason}
          onChange={(e) => setDisconnectReason(e.target.value)}
          placeholder="Please tell us why you want to disconnect..."
          rows={4}
          disabled={!canDisconnect}
          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:bg-bg-secondary bg-input-bg text-text-primary placeholder-text-tertiary"
        />
        <p className="text-xs text-text-tertiary mt-1">Our team will review your request within 24-48 hours.</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <button
          onClick={() => { setShowDisconnectConfirm(false); setDisconnectReason(""); }}
          disabled={disconnectLoading}
          className="px-4 py-2.5 text-text-secondary font-medium border border-border rounded-xl hover:bg-bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDisconnect}
          disabled={!canDisconnect || !disconnectReason.trim() || disconnectLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {disconnectLoading ? <><Spinner sm />Submitting…</> : "Request Disconnect"}
        </button>
      </div>
    </div>
  );

  // ─── Modal shell ──────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Sticky header */}
        <div className="sticky top-0 bg-card-bg border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text-primary">
            {showDisconnectConfirm ? "Disconnect Account" : "Stripe Account"}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showDisconnectConfirm ? <DisconnectContent /> : <MainContent />}
      </div>
    </div>
  );
};

export default StripeSetupModal;
