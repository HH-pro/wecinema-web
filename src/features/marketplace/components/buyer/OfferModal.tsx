"use client";

/**
 * OfferModal — Wecinema Marketplace
 */

import React, { useId, useMemo } from "react";
import {
  FiAlertCircle, FiCreditCard, FiImage,
  FiLoader, FiUser, FiX,
} from "react-icons/fi";
import { FiShoppingBag } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import type { Listing } from "@/types/marketplace.types";

// ─── Types ────────────────────────────────────────────────────

export interface OfferFormState {
  amount:           string;
  message:          string;
  requirements:     string;
  expectedDelivery: string;
}

type PaymentStatus = "idle" | "processing" | "success" | "failed";

interface OfferModalProps {
  show:             boolean;
  selectedListing:  Listing | null;
  offerForm:        OfferFormState;
  onClose:          () => void;
  onSubmit:         (e: React.FormEvent) => void;
  onOfferFormChange: (field: keyof OfferFormState, value: string) => void;
  paymentStatus:    PaymentStatus;
  error:            string;
  getThumbnailUrl:  (listing: Listing) => string;
}

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatSubmitLabel(amount: string): string {
  const num = parseFloat(amount);
  return `Submit Offer & Pay ${isNaN(num) ? "$0.00" : formatCurrency(num)}`;
}

// ─── OfferModal ───────────────────────────────────────────────

const OfferModal: React.FC<OfferModalProps> = ({
  show,
  selectedListing,
  offerForm,
  onClose,
  onSubmit,
  onOfferFormChange,
  paymentStatus,
  error,
  getThumbnailUrl,
}) => {
  const formId    = useId();
  const isProcessing = paymentStatus === "processing";

  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  const thumbnailUrl = useMemo(
    () => (selectedListing ? getThumbnailUrl(selectedListing) : ""),
    [selectedListing, getThumbnailUrl]
  );

  const sellerName =
    (selectedListing as any)?.sellerId?.username ??
    (selectedListing as any)?.seller?.username ??
    "Seller";

  return (
    <AnimatePresence>
      {show && selectedListing && (
        <div
          className="mp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: 12,  scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="mp-modal"
            style={{ maxWidth: '500px' }}
          >
            {/* ── Header ─────────────────────────────────── */}
            <div className="mp-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 15%, transparent)' }}>
                  <FiShoppingBag size={16} style={{ color: 'var(--color-accent-primary)' }} />
                </div>
                <div>
                  <h3 id="offer-modal-title" className="text-base font-bold"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Make an Offer
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Submit your offer for this listing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mp-btn mp-btn-ghost mp-btn-sm !rounded-full !p-0 w-8 h-8"
                aria-label="Close modal"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* ── Scrollable body ─────────────────────────── */}
            <div className="mp-modal-body space-y-4">

              {/* Listing preview */}
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-card-border)',
                }}>
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)' }}>
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={selectedListing.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {selectedListing.title}
                  </h4>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedListing.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
                      {formatCurrency(selectedListing.price ?? 0)}
                    </span>
                    {selectedListing.category && (
                      <span className="mp-badge mp-badge-accent text-[10px]">
                        {selectedListing.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    <FiUser size={11} />
                    <span>Seller: {sellerName}</span>
                  </div>
                </div>
              </div>

              {/* ── Form ─────────────────────────────────── */}
              <form id={formId} onSubmit={onSubmit} className="space-y-4">

                {/* Amount */}
                <div>
                  <label htmlFor={`${formId}-amount`} className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Offer Amount (USD)
                    <span className="ml-0.5" style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none"
                      style={{ color: 'var(--color-text-tertiary)' }}>$</span>
                    <input
                      id={`${formId}-amount`}
                      type="number"
                      required
                      autoFocus
                      min="0.50"
                      step="0.01"
                      value={offerForm.amount}
                      onChange={(e) => onOfferFormChange("amount", e.target.value)}
                      className="mp-input"
                      style={{ paddingLeft: '28px' }}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Minimum offer: $0.50
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor={`${formId}-message`} className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Message to Seller
                  </label>
                  <textarea
                    id={`${formId}-message`}
                    value={offerForm.message}
                    onChange={(e) => onOfferFormChange("message", e.target.value)}
                    className="mp-textarea"
                    rows={3}
                    placeholder="Introduce yourself and explain your requirements…"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label htmlFor={`${formId}-requirements`} className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Specific Requirements
                  </label>
                  <textarea
                    id={`${formId}-requirements`}
                    value={offerForm.requirements}
                    onChange={(e) => onOfferFormChange("requirements", e.target.value)}
                    className="mp-textarea"
                    rows={2}
                    placeholder="Any specific modifications or requirements…"
                  />
                </div>

                {/* Delivery date */}
                <div>
                  <label htmlFor={`${formId}-delivery`} className="block text-xs font-semibold mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}>
                    Expected Delivery Date
                    <span className="ml-0.5" style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id={`${formId}-delivery`}
                    type="date"
                    required
                    value={offerForm.expectedDelivery}
                    onChange={(e) => onOfferFormChange("expectedDelivery", e.target.value)}
                    className="mp-input"
                    min={todayISO}
                  />
                </div>

                {/* Escrow info */}
                <div className="mp-alert mp-alert-warning">
                  <FiCreditCard size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    Payment is processed immediately and held securely in escrow until the seller accepts your offer.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mp-alert mp-alert-danger" role="alert">
                    <FiAlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}
              </form>
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="mp-modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="mp-btn mp-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                form={formId}
                disabled={isProcessing}
                className="mp-btn mp-btn-primary flex-1"
              >
                {isProcessing ? (
                  <>
                    <FiLoader className="animate-spin" size={14} />
                    Processing…
                  </>
                ) : (
                  <>
                    <FiShoppingBag size={14} />
                    {formatSubmitLabel(offerForm.amount)}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OfferModal;
