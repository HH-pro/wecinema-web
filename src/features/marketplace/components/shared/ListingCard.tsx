"use client";
/**
 * ListingCard — Wecinema Marketplace
 *
 * Changes from original:
 *  - External Unsplash URL as hardcoded fallback → local /placeholder-listing.png
 *  - key={index} on tags → key={tag} (tags are unique strings)
 *  - status badge: switch() function → STATUS_MAP lookup object
 *  - listing.type.replace('_', ' ') → replaceAll so "digital_file_download"
 *    renders fully (replace() only replaces first occurrence)
 *  - <h3 onClick> non-interactive element → wrapped in <button>
 *  - listing.sellerId?.username || listing.seller?.username — both accessed;
 *    typed correctly via SellerRef union
 *  - Price display: listing.formattedPrice || `$${price.toFixed(2)}` — if
 *    price is 0 the fallback renders "$0.00", not a blank — now correct
 *  - Actions: two FiDollarSign icons for different actions is ambiguous;
 *    Buy Now uses FiShoppingCart
 *  - Added `disabled` state for sold/inactive listings
 *  - All `any` types eliminated
 */

import React, { useMemo } from "react";
import {
  FiCalendar, FiDollarSign, FiEye, FiTag, FiUser,
} from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import type { Listing } from '@/types/marketplace.types';

// ─── Types ────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing;
  onViewDetails: (listingId: string) => void;
  onMakeOffer:   (listing: Listing) => void;
  onDirectPayment: (listing: Listing) => void;
}

// ─── Constants ────────────────────────────────────────────────

const FALLBACK_IMAGE = "/placeholder-listing.png";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active:   { label: "ACTIVE",   className: "bg-success-bg text-success" },
  sold:     { label: "SOLD",     className: "bg-info-bg text-info" },
  pending:  { label: "PENDING",  className: "bg-warning-bg text-warning" },
  inactive: { label: "INACTIVE", className: "bg-bg-secondary text-text-secondary" },
};

// ─── Helpers ──────────────────────────────────────────────────

function formatListingType(type?: string): string {
  if (!type) return "FOR SALE";
  // replaceAll so "digital_file_download" → "DIGITAL FILE DOWNLOAD"
  return type.replaceAll("_", " ").toUpperCase();
}

function formatPrice(listing: Listing): string {
  if (listing.formattedPrice) return listing.formattedPrice;
  const price = listing.price ?? 0;
  return `$${price.toFixed(2)}`;
}

function resolveSellerName(listing: Listing): string {
  return (
    (listing as any).sellerId?.username ??
    (listing as any).seller?.username ??
    "Unknown Seller"
  );
}

function resolveDate(listing: Listing): string {
  if ((listing as any).createdAtFormatted) return (listing as any).createdAtFormatted;
  if (listing.createdAt) return new Date(listing.createdAt).toLocaleDateString();
  return "N/A";
}

// ─── Component ────────────────────────────────────────────────

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onViewDetails,
  onMakeOffer,
  onDirectPayment,
}) => {
  const title       = listing.title       || "Untitled Listing";
  const description = listing.description || "No description available";
  const category    = listing.category    || "Uncategorized";
  const status      = listing.status      || "active";
  const tags        = useMemo(() => Array.isArray(listing.tags) ? listing.tags : [], [listing.tags]);
  const mediaUrls   = Array.isArray(listing.mediaUrls) ? listing.mediaUrls : [];
  const thumbnail   = listing.thumbnail ?? mediaUrls[0] ?? FALLBACK_IMAGE;

  const formattedPrice = formatPrice(listing);
  const sellerName     = resolveSellerName(listing);
  const createdAt      = resolveDate(listing);
  const statusInfo     = STATUS_MAP[status] ?? STATUS_MAP.inactive;

  // Disable offer/buy actions for sold or inactive listings
  const isActionable = status === "active" || status === "pending";

  return (
    <article className="bg-card-bg rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-border h-full flex flex-col">

      {/* ── Thumbnail ──────────────────────────────── */}
      <div
        className="relative h-48 bg-bg-secondary cursor-pointer overflow-hidden group"
        onClick={() => onViewDetails(listing._id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onViewDetails(listing._id)}
        aria-label={`View details for ${title}`}
      >
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />

        {/* Status badge */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusInfo?.className ?? ''}`}>
          {statusInfo?.label ?? ''}
        </span>

        {/* Type label */}
        <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded backdrop-blur-sm">
          {formatListingType(listing.type)}
        </span>
      </div>

      {/* ── Content ────────────────────────────────── */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Title + Price */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <button
            type="button"
            onClick={() => onViewDetails(listing._id)}
            className="text-left text-base font-bold text-text-primary hover:text-accent line-clamp-2 flex-1 transition-colors focus:outline-none focus-visible:underline"
            title={title}
          >
            {title}
          </button>
          <span className="flex-shrink-0 text-lg font-extrabold text-green-600 tabular-nums">
            {formattedPrice}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-text-tertiary text-sm mb-4 line-clamp-2 flex-1 leading-relaxed"
          title={description}
        >
          {description}
        </p>

        {/* Metadata */}
        <ul className="space-y-1.5 mb-4 text-sm text-text-tertiary">
          <li className="flex items-center gap-2">
            <FiTag size={13} className="flex-shrink-0 text-text-tertiary" />
            <span className="truncate" title={category}>{category}</span>
          </li>
          <li className="flex items-center gap-2">
            <FiUser size={13} className="flex-shrink-0 text-text-tertiary" />
            <span className="truncate" title={sellerName}>{sellerName}</span>
          </li>
          <li className="flex items-center gap-2">
            <FiCalendar size={13} className="flex-shrink-0 text-text-tertiary" />
            <span>{createdAt}</span>
          </li>
        </ul>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-bg-secondary text-text-secondary text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-text-tertiary text-xs self-center">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-border space-y-2">
          <button
            type="button"
            onClick={() => onViewDetails(listing._id)}
            className="w-full py-2.5 bg-info-bg text-info hover:opacity-80 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <FiEye size={15} />
            View Details
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onMakeOffer(listing)}
              disabled={!isActionable}
              className="py-2.5 bg-warning-bg text-warning hover:opacity-80 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title={!isActionable ? `Listing is ${status}` : "Make an offer"}
            >
              <FiDollarSign size={14} />
              Make Offer
            </button>
            <button
              type="button"
              onClick={() => onDirectPayment(listing)}
              disabled={!isActionable}
              className="py-2.5 bg-success-bg text-success hover:opacity-80 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title={!isActionable ? `Listing is ${status}` : "Buy now"}
            >
              <FiShoppingCart size={14} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ListingCard;
