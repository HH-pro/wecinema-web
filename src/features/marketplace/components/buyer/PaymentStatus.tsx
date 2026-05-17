"use client";

import React, { useEffect, useRef } from "react";
import {
  AlertCircle, CheckCircle2, Clock, Loader2,
  RefreshCw, XCircle, PartyPopper, FileText,
} from "lucide-react";

import { usePaymentStatus } from "@/hooks/usePaymentStatus";

// ─── Types ────────────────────────────────────────────────────

interface PaymentStatusProps {
  orderId:        string;
  onStatusChange?: (status: string) => void;
  pollInterval?:  number;
}

// ─── Constants ────────────────────────────────────────────────

const POLL_DEFAULT = 10_000;

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "completed"
  | "cancelled"
  | string;

interface StatusConfig {
  label:     string;
  Icon:      React.FC<{ size?: number; className?: string }>;
  iconClass: string;
  badgeClass: string;
  noteClass:  string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending_payment: {
    label:      "Pending Payment",
    Icon:       Clock,
    iconClass:  "text-warning",
    badgeClass: "bg-warning-bg text-warning border-warning",
    noteClass:  "bg-warning-bg border-warning text-warning",
  },
  paid: {
    label:      "Paid",
    Icon:       CheckCircle2,
    iconClass:  "text-info",
    badgeClass: "bg-info-bg text-info border-info",
    noteClass:  "bg-info-bg border-info text-info",
  },
  completed: {
    label:      "Completed",
    Icon:       PartyPopper,
    iconClass:  "text-success",
    badgeClass: "bg-success-bg text-success border-success",
    noteClass:  "bg-success-bg border-success text-success",
  },
  cancelled: {
    label:      "Cancelled",
    Icon:       XCircle,
    iconClass:  "text-danger",
    badgeClass: "bg-danger-bg text-danger border-danger",
    noteClass:  "bg-danger-bg border-danger text-danger",
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label:      "Unknown",
  Icon:       FileText,
  iconClass:  "text-text-tertiary",
  badgeClass: "bg-bg-secondary text-text-secondary border-border",
  noteClass:  "bg-bg-secondary border-border text-text-secondary",
};

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatUnixDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatISODate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

const STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  pending_payment:
    "Waiting for payment confirmation. Funds will be held in escrow until order completion.",
  paid:
    "Payment received! Funds are secured in escrow. The seller will begin working on your order.",
};

// ─── Component ────────────────────────────────────────────────

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  orderId,
  onStatusChange,
  pollInterval = POLL_DEFAULT,
}) => {
  const { status, loading, error, refetch } = usePaymentStatus(orderId);

  const prevStatusRef = useRef<string | null>(null);
  if (status?.orderStatus && status.orderStatus !== prevStatusRef.current) {
    prevStatusRef.current = status.orderStatus;
    onStatusChange?.(status.orderStatus);
  }

  useEffect(() => {
    const id = setInterval(refetch, pollInterval);
    return () => clearInterval(id);
  }, [refetch, pollInterval]);

  if (loading && !status) {
    return (
      <div className="flex items-center gap-3 py-4 px-5 bg-bg-secondary rounded-2xl border border-border">
        <Loader2 size={18} className="animate-spin text-text-tertiary flex-shrink-0" />
        <span className="text-sm text-text-tertiary">Checking payment status…</span>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex items-start gap-3 py-4 px-5 bg-danger-bg border border-danger rounded-2xl" role="alert">
        <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-danger font-medium">Failed to load payment status</p>
          <p className="text-xs text-danger mt-0.5 break-words">{error}</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex-shrink-0 p-1.5 rounded-lg text-danger hover:opacity-80 transition-colors"
          aria-label="Retry"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="py-4 px-5 bg-bg-secondary border border-border rounded-2xl text-sm text-text-tertiary text-center">
        No payment information available
      </div>
    );
  }

  const config = STATUS_CONFIG[status.orderStatus] ?? DEFAULT_STATUS_CONFIG;
  const { Icon, iconClass, badgeClass, noteClass } = config;

  const note =
    status.orderStatus === "completed" && status.paymentReleased
      ? "Payment complete! Funds have been released to the seller."
      : STATUS_NOTES[status.orderStatus];

  return (
    <div
      className="bg-card-bg border border-border rounded-2xl shadow-sm overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-bg-secondary flex items-center justify-center flex-shrink-0 ${iconClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">Payment Status</p>
            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border mt-0.5 ${badgeClass}`}>
              {status.orderStatus.replaceAll("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary transition-colors disabled:opacity-40"
          aria-label="Refresh status"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        {status.paymentIntent && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-text-tertiary">Amount</dt>
              <dd className="font-semibold text-text-primary tabular-nums">
                {formatCurrency(status.paymentIntent.amount)}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-text-tertiary">Currency</dt>
              <dd className="font-medium text-text-secondary uppercase">
                {status.paymentIntent.currency}
              </dd>
            </div>
            {status.paymentIntent.created && (
              <div className="flex justify-between items-center">
                <dt className="text-text-tertiary">Payment Created</dt>
                <dd className="font-medium text-text-secondary">
                  {formatUnixDate(status.paymentIntent.created)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {status.paymentReleased && status.releaseDate && (
          <div className="flex justify-between items-center text-sm pt-1 border-t border-border">
            <span className="text-text-tertiary">Funds Released</span>
            <span className="font-medium text-success">
              {formatISODate(status.releaseDate)}
            </span>
          </div>
        )}
      </div>

      {/* Status note */}
      {note && (
        <div className={`mx-4 mb-4 px-3 py-2.5 rounded-xl border text-xs leading-relaxed ${noteClass}`}>
          {note}
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;
