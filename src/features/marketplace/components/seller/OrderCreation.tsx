"use client";
/**
 * OrderCreation — Wecinema Marketplace
 *
 * Changes from original:
 *  - import { createOrder, checkStripeStatus } from '../../../api' raw imports
 *    → useOrderCreation() hook
 *  - import { getCurrentUserId } from '../../../utilities/helperfFunction'
 *    → useAuth().authUser._id — single source of truth, no helper needed
 *  - checkStripeAccount not in useCallback — stale closure, re-registers on render
 *  - alert('Order created successfully!') — blocks UI, no styling → toast
 *  - window.location.href = '/seller/settings?tab=payments' — hard navigation,
 *    loses React state → useNavigate()
 *  - ₹ hardcoded rupee symbol in a Stripe USD codebase → formatCurrency()
 *    using Intl.NumberFormat with USD (matches rest of marketplace)
 *  - offer.amount * 0.85 payout magic number hardcoded twice → PLATFORM_FEE_RATE
 *    constant (15%)
 *  - error: any in catch → error: unknown with instanceof guard
 *  - stripeStatus repeated truthy check 6 times → isStripeReady helper
 *  - orderDetails field updates: setOrderDetails(prev => ({ ...prev, field }))
 *    for every field → single handleField() updater
 *  - console.error in production → removed
 *  - parseInt(e.target.value) without radix → parseInt(e.target.value, 10)
 */

import React, { useCallback, useId, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useOrderCreation } from '@/hooks/useOrderCreation';

// ─── Types ────────────────────────────────────────────────────

interface OfferListing {
  _id:    string;
  title:  string;
  price?: number;
}

interface OfferBuyer {
  _id:      string;
  username: string;
}

export interface Offer {
  _id:       string;
  listingId: OfferListing;
  buyerId:   OfferBuyer;
  amount:    number;
}

interface OrderDetails {
  shippingAddress:      string;
  paymentMethod:        string;
  notes:                string;
  expectedDeliveryDays: number;
}

interface OrderCreationProps {
  offer:          Offer;
  onOrderCreated: (order: unknown) => void;
  onClose:        () => void;
}

// ─── Constants ────────────────────────────────────────────────

const PLATFORM_FEE_RATE = 0.15; // 15%

const DELIVERY_OPTIONS = [
  { value: 3,  label: "3 days (Express)" },
  { value: 7,  label: "7 days (Standard)" },
  { value: 14, label: "14 days (Economy)" },
  { value: 30, label: "30 days (Custom)" },
] as const;

const PAYMENT_METHODS = [
  { value: "card",       label: "Credit / Debit Card" },
  { value: "upi",        label: "UPI" },
  { value: "netbanking", label: "Net Banking" },
] as const;

const SETTINGS_URL = "/seller/settings?tab=payments";

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format(amount);
}

function isStripeReady(status: { connected: boolean; status: string } | null): boolean {
  return !!status?.connected && status.status === "active";
}

// ─── Field label ──────────────────────────────────────────────

const FieldLabel: React.FC<{
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ htmlFor, required, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-text-secondary mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const inputClass =
  "w-full px-3 py-2.5 border border-input-border rounded-xl text-sm outline-none " +
  "focus:ring-2 focus:border-input-focus focus:ring-accent/40 transition-all " +
  "placeholder:text-text-tertiary bg-input-bg text-text-primary";

// ─── OrderCreation ────────────────────────────────────────────

const OrderCreation: React.FC<OrderCreationProps> = ({ offer, onOrderCreated, onClose }) => {
  const router = useRouter();
  const { authUser } = useAuth();
  const formId     = useId();

  const { stripeStatus, stripeLoading, createOrder, loading, error } = useOrderCreation();

  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    shippingAddress:      "",
    paymentMethod:        "card",
    notes:                "",
    expectedDeliveryDays: 7,
  });

  const stripeReady = isStripeReady(stripeStatus);
  const payout      = offer.amount * (1 - PLATFORM_FEE_RATE);

  const handleField = useCallback(
    <K extends keyof OrderDetails>(field: K, value: OrderDetails[K]) => {
      setOrderDetails((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderDetails.shippingAddress.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    if (!stripeReady) {
      toast.error("Please connect and activate your Stripe account first");
      return;
    }

    const result = await createOrder({
      offerId:              offer._id,
      listingId:            offer.listingId._id,
      buyerId:              offer.buyerId._id,
      sellerId:             authUser?._id ?? "",
      amount:               offer.amount,
      shippingAddress:      orderDetails.shippingAddress,
      paymentMethod:        orderDetails.paymentMethod,
      notes:                orderDetails.notes,
      expectedDeliveryDays: orderDetails.expectedDeliveryDays,
    });

    if (result) {
      toast.success("Order created! The buyer will now complete payment.");
      onOrderCreated(result);
      onClose();
      const orderId = (result as any)?._id;
      if (orderId) router.push(`/marketplace/messages?order=${orderId}`);
    }
  }, [
    orderDetails, stripeReady, offer,
    authUser?._id, createOrder, onOrderCreated, onClose,
  ]);

  // ── Stripe loading ───────────────────────────────────────────
  if (stripeLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card-bg rounded-2xl shadow-2xl p-8 flex items-center gap-3 border border-border theme-transition">
          <Loader2 size={22} className="animate-spin text-blue-500" />
          <span className="text-sm text-text-secondary font-medium">Checking payment setup…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 340 }}
        className="bg-modal-bg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border theme-transition"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Create Order</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Confirm details and create order for buyer</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────── */}
        <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: "calc(100vh - 12rem)" }}>

          {/* Stripe status banner */}
          <div className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
            stripeReady
              ? "bg-success-bg border-success/30"
              : "bg-danger-bg border-danger/30"
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {stripeReady
                ? <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                : <XCircle      size={16} className="text-danger flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  Stripe {stripeReady ? "Connected" : "Not Connected"}
                </p>
                {!stripeReady && stripeStatus?.connected && (
                  <p className="text-xs text-danger mt-0.5">
                    Complete Stripe onboarding to receive payments
                  </p>
                )}
              </div>
            </div>
            {!stripeReady && (
              <button
                type="button"
                onClick={() => router.push(SETTINGS_URL)}
                className="flex-shrink-0 text-xs font-bold text-info hover:opacity-80 px-3 py-1.5 rounded-lg bg-info-bg border border-info/30 transition-colors"
              >
                Setup
              </button>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-2 text-sm">
            <h3 className="font-bold text-text-secondary text-xs uppercase tracking-wide mb-3">Order Summary</h3>
            {[
              { label: "Listing", value: offer.listingId?.title },
              { label: "Buyer",   value: offer.buyerId?.username },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-text-secondary">{label}</span>
                <span className="font-medium text-text-primary text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-text-secondary">Offer Amount</span>
              <span className="font-bold text-success tabular-nums">{formatCurrency(offer.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">
                Your Payout
                <span className="text-text-tertiary ml-1 text-xs">(after {PLATFORM_FEE_RATE * 100}% fee)</span>
              </span>
              <span className="font-bold text-info tabular-nums">{formatCurrency(payout)}</span>
            </div>
          </div>

          {/* Form */}
          <form id={formId} onSubmit={handleSubmit} className="space-y-4">

            {/* Shipping address */}
            <div>
              <FieldLabel htmlFor={`${formId}-address`} required>Shipping Address</FieldLabel>
              <textarea
                id={`${formId}-address`}
                value={orderDetails.shippingAddress}
                onChange={(e) => handleField("shippingAddress", e.target.value)}
                placeholder="Full address including city, state, and ZIP / PIN code"
                className={`${inputClass} resize-none`}
                rows={3}
                required
                autoFocus
              />
            </div>

            {/* Delivery days */}
            <div>
              <FieldLabel htmlFor={`${formId}-delivery`}>Expected Delivery</FieldLabel>
              <select
                id={`${formId}-delivery`}
                value={orderDetails.expectedDeliveryDays}
                onChange={(e) => handleField("expectedDeliveryDays", parseInt(e.target.value, 10))}
                className={inputClass}
              >
                {DELIVERY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Payment method */}
            <div>
              <FieldLabel htmlFor={`${formId}-payment`}>Payment Method</FieldLabel>
              <select
                id={`${formId}-payment`}
                value={orderDetails.paymentMethod}
                onChange={(e) => handleField("paymentMethod", e.target.value)}
                className={inputClass}
              >
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <FieldLabel htmlFor={`${formId}-notes`}>Additional Notes</FieldLabel>
              <textarea
                id={`${formId}-notes`}
                value={orderDetails.notes}
                onChange={(e) => handleField("notes", e.target.value)}
                placeholder="Any additional instructions for the buyer…"
                className={`${inputClass} resize-none`}
                rows={2}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{   opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-danger-bg border border-danger/30 rounded-xl p-3 text-sm text-danger overflow-hidden"
                  role="alert"
                >
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <p>{error}</p>
                    {error.toLowerCase().includes("stripe") && (
                      <button
                        type="button"
                        onClick={() => router.push(SETTINGS_URL)}
                        className="text-info hover:opacity-80 font-semibold mt-1.5 text-xs"
                      >
                        Go to Payment Settings →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-btn-secondary-text hover:bg-btn-secondary-hover bg-btn-secondary-bg disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={loading || !stripeReady}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:bg-bg-tertiary disabled:cursor-not-allowed text-btn-primary-text rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            title={!stripeReady ? "Connect your Stripe account first" : undefined}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Creating…</>
            ) : (
              "Create Order"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderCreation;
