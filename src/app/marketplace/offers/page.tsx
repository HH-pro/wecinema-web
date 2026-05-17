"use client";
/**
 * MyOffersPage — Wecinema Marketplace
 *
 * Changes from original:
 *  - import marketplaceApi + direct calls → useMyOffers() hook
 *  - import './MyOffersPage.css' → pure Tailwind
 *  - formatCurrency: marketplaceApi.utils.formatCurrencyshow() → Intl.NumberFormat
 *  - fetchMyOffers not in useCallback — stale closure in refresh button
 *  - handleCancelOffer: window.confirm() → inline confirmation state
 *    (window.confirm blocks the main thread and is unstyled)
 *  - getStatusColor returns hex for inline style → STATUS_CONFIG Tailwind classes
 *  - getStats() computed on every render → useMemo
 *  - filteredOffers computed on every render → useMemo
 *  - error: any in catch → error: unknown
 *  - key={offer._id} already correct — kept
 *  - FaSync imported for spinner but used with CSS animation class that
 *    doesn't exist → Loader2 from lucide-react with animate-spin
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  FaArrowLeft, FaCalendar, FaCheckCircle, FaClock,
  FaComment, FaDollarSign, FaEye, FaFilter,
  FaSearch, FaShoppingBag, FaTimes,
} from "react-icons/fa";
import { Loader2, RefreshCw, X } from "lucide-react";
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useMyOffers } from '@/hooks/useOffer';
import * as offerService from '@/features/marketplace/api/offer.service';
import type { Offer } from '@/types/offer.types';

// ─── Helpers ──────────────────────────────────────────────────

/** amount is in DOLLARS — use for listing.price (seller-set) */
function formatDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format(amount);
}

/** amount is in CENTS — use for offer.amount */
function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
  }).format((cents || 0) / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/** Returns offer amount in CENTS (as stored) */
function getOfferAmountCents(offer: Offer): number {
  return (offer as any).amount ?? 0;
}

function resolveSellerName(offer: Offer): string {
  const s = offer.sellerId as any;
  if (!s) return "Unknown Seller";
  const full = [s.firstName, s.lastName].filter(Boolean).join(" ").trim();
  return full || s.username || "Unknown Seller";
}

// ─── Status config ────────────────────────────────────────────

interface StatusConfig { label: string; badgeClass: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:         { label: "Pending",         badgeClass: "bg-warning-bg text-warning border-warning" },
  accepted:        { label: "Accepted",        badgeClass: "bg-success-bg text-success border-success" },
  rejected:        { label: "Rejected",        badgeClass: "bg-danger-bg text-danger border-danger" },
  cancelled:       { label: "Cancelled",       badgeClass: "bg-bg-secondary text-text-tertiary border-border" },
  expired:         { label: "Expired",         badgeClass: "bg-bg-secondary text-text-tertiary border-border" },
  pending_payment: { label: "Pending Payment", badgeClass: "bg-info-bg text-info border-info" },
  paid:            { label: "Paid",            badgeClass: "bg-success-bg text-success border-success" },
};

const DEFAULT_STATUS: StatusConfig = {
  label:      "Unknown",
  badgeClass: "bg-bg-secondary text-text-tertiary border-border",
};

// ─── Stat pill ────────────────────────────────────────────────

const StatPill: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
}> = ({ icon, value, label, iconBg }) => (
  <div className="bg-card-bg rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-base flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-xl font-extrabold text-text-primary tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-text-tertiary font-medium">{label}</p>
    </div>
  </div>
);

// ─── Confirm cancel dialog ────────────────────────────────────
// FIX: replaces window.confirm() — styled, non-blocking

const CancelConfirmDialog: React.FC<{
  onConfirm: () => void;
  onClose:   () => void;
}> = ({ onConfirm, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div
      className="bg-card-bg rounded-2xl shadow-2xl p-6 max-w-sm w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold text-text-primary mb-2">Cancel Offer?</h3>
      <p className="text-sm text-text-tertiary mb-5">This action cannot be undone. The offer will be permanently cancelled.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-medium hover:bg-bg-secondary transition-colors"
        >
          Keep Offer
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          Cancel Offer
        </button>
      </div>
    </div>
  </div>
);

// ─── OfferCard ────────────────────────────────────────────────

const OfferCard: React.FC<{
  offer:           Offer;
  onViewListing:   (id: string) => void;
  onContactSeller: (id: string) => void;
  onCancelOffer:   (id: string) => void;
  cancelling:      boolean;
}> = ({ offer, onViewListing, onContactSeller, onCancelOffer, cancelling }) => {
  const config  = STATUS_CONFIG[offer.status] ?? DEFAULT_STATUS;
  const amount  = getOfferAmountCents(offer);
  const listing = offer.listingId;
  const seller  = offer.sellerId;

  const listingAny = listing as any;
  const sellerAny  = seller  as any;
  const offerAny   = offer   as any;

  return (
    <article className="bg-card-bg rounded-2xl border border-border shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-bold text-text-primary text-base line-clamp-2 flex-1">
          {listingAny?.title || "Unknown Listing"}
        </h3>
        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {/* Details grid */}
      <dl className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <dt className="text-text-tertiary">Offered Amount</dt>
          <dd className="font-bold text-success tabular-nums">{formatCents(amount)}</dd>
        </div>
        {listingAny?.price && (
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Listing Price</dt>
            <dd className="font-medium text-text-secondary tabular-nums">{formatDollars(listingAny.price)}</dd>
          </div>
        )}
        {seller && (
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Seller</dt>
            <dd className="font-medium text-text-secondary">{resolveSellerName(offer)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-text-tertiary flex items-center gap-1"><FaCalendar size={11} /> Submitted</dt>
          <dd className="font-medium text-text-secondary">{formatDate(offer.createdAt)}</dd>
        </div>
        {offerAny.expiresAt && (
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Expires</dt>
            <dd className="font-medium text-text-secondary">{formatDate(offerAny.expiresAt)}</dd>
          </div>
        )}
      </dl>

      {/* Message */}
      {offer.message && (
        <div className="bg-bg-secondary rounded-xl px-3 py-2.5 mb-3 text-xs text-text-secondary border border-border">
          <p className="font-semibold text-text-tertiary mb-1">Your Message</p>
          <p className="break-words">{offer.message}</p>
        </div>
      )}

      {/* Counter offer */}
      {offerAny.counterOffer && (
        <div className="bg-info-bg rounded-xl px-3 py-2.5 mb-3 text-xs text-info border border-border">
          <p className="font-semibold mb-1">
            Counter Offer: <span className="tabular-nums">{formatCents(offerAny.counterOffer.amount)}</span>
          </p>
          {offerAny.counterOffer.message && <p className="break-words">{offerAny.counterOffer.message}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        {listingAny?._id && (
          <button
            type="button"
            onClick={() => onViewListing(listingAny._id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-info-bg text-info hover:opacity-80 rounded-xl text-xs font-medium transition-colors"
          >
            <FaEye size={12} /> View Listing
          </button>
        )}
        {sellerAny?._id && (
          <button
            type="button"
            onClick={() => onContactSeller(sellerAny._id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary rounded-xl text-xs font-medium transition-colors"
          >
            <FaComment size={12} /> Contact Seller
          </button>
        )}
        {offer.status === "pending" && (
          <button
            type="button"
            onClick={() => onCancelOffer(offer._id)}
            disabled={cancelling}
            className="flex items-center gap-1.5 px-3 py-2 bg-danger-bg text-danger hover:opacity-80 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            <X size={12} /> Cancel
          </button>
        )}
      </div>
    </article>
  );
};

// ─── MyOffersPage ─────────────────────────────────────────────

const MyOffersPage: React.FC = () => {
  const router = useRouter();
  const { offers, loading, refetch } = useMyOffers();

  const [searchQuery,   setSearchQuery]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [cancelling,    setCancelling]    = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // FIX: memoised — not recomputed on every render
  const filteredOffers = useMemo(() =>
    offers.filter((o: any) => {
      const matchSearch =
        o.listingId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [offers, searchQuery, statusFilter]
  );

  const stats = useMemo(() => ({
    total:       offers.length,
    pending:     offers.filter((o) => o.status === "pending").length,
    accepted:    offers.filter((o) => o.status === "accepted").length,
    totalAmountCents: offers.reduce((s, o) => s + getOfferAmountCents(o), 0),
  }), [offers]);

  const handleCancelOffer = useCallback(async (offerId: string) => {
    setCancelling(offerId);
    try {
      await offerService.cancelOffer(offerId);
      toast.success("Offer cancelled");
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel offer");
    } finally {
      setCancelling(null);
    }
  }, [refetch]);

  // ── Loading ──────────────────────────────────────────────────
  if (loading && offers.length === 0) {
    return (
      <MarketplaceLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-yellow-500" />
          <p className="text-sm text-text-tertiary font-medium">Loading your offers…</p>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/marketplace/dashboard/buyer")}
            className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors"
          >
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-text-primary">My Offers</h1>
            <p className="text-sm text-text-tertiary">View and manage your purchase offers</p>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill icon={<FaShoppingBag />} iconBg="bg-blue-500"   value={stats.total}               label="Total Offers" />
          <StatPill icon={<FaClock />}       iconBg="bg-amber-500"  value={stats.pending}              label="Pending" />
          <StatPill icon={<FaCheckCircle />} iconBg="bg-green-500"  value={stats.accepted}             label="Accepted" />
          <StatPill icon={<FaDollarSign />}  iconBg="bg-purple-500" value={formatCents(stats.totalAmountCents)} label="Total Amount" />
        </div>

        {/* ── Filters ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px] relative">
            <FaSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search offers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all bg-input-bg text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <div className="relative">
            <FaFilter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-input-bg text-text-primary transition-all"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-secondary disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Offers list ─────────────────────────────── */}
        {filteredOffers.length > 0 ? (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer._id}
                offer={offer}
                onViewListing={(id) => router.push(`/marketplace/listings/${id}`)}
                onContactSeller={(id) => router.push(`/marketplace/messages?seller=${id}`)}
                onCancelOffer={(id) => setConfirmCancel(id)}
                cancelling={cancelling === offer._id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-4">
              <FaShoppingBag className="text-text-tertiary text-xl" />
            </div>
            <h3 className="font-bold text-text-primary mb-1">
              {offers.length === 0 ? "No offers yet" : "No matching offers"}
            </h3>
            <p className="text-sm text-text-tertiary mb-5">
              {offers.length === 0
                ? "You haven't made any offers yet"
                : "Try adjusting your search or filter"}
            </p>
            {offers.length === 0 && (
              <button
                type="button"
                onClick={() => router.push("/marketplace")}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-btn-primary-text font-bold rounded-xl text-sm transition-colors"
              >
                Browse Listings
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Cancel confirmation ─────────────────────── */}
      {confirmCancel && (
        <CancelConfirmDialog
          onConfirm={() => handleCancelOffer(confirmCancel)}
          onClose={() => setConfirmCancel(null)}
        />
      )}
    </MarketplaceLayout>
  );
};

export default MyOffersPage;
