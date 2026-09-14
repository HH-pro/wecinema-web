"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EllipsisVertical, ExternalLink, Eye, MessageSquare, Undo2 } from "lucide-react";
import { DealPoster } from "./DealPoster";
import { DealStatusBadge } from "./DealStatusBadge";
import { accentOutline, cardGlow } from "./styles";
import {
  dealTypeLabel,
  formatCents,
  formatDealDate,
  lastActivityText,
  termLabel,
  territoryLabel,
} from "../lib/dealFormat";
import type { Deal } from "../types/deal.types";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-1">
      <dt className="flex-shrink-0 text-text-tertiary">{label}:</dt>
      <dd className="truncate text-text-secondary">{value}</dd>
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  userId?: string;
  onWithdraw?: (deal: Deal) => void;
}

export function DealCard({ deal, userId, onWithdraw }: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const roomHref = `/marketplace/deal/${deal._id}`;
  const title = deal.listing.year ? `${deal.listing.title} (${deal.listing.year})` : deal.listing.title;
  const other =
    deal.viewerRole === "buyer"
      ? { label: "Seller", name: deal.seller.username }
      : { label: "Buyer", name: deal.buyer.username };
  const canWithdraw =
    !!onWithdraw && deal.viewerRole === "buyer" && ["pending", "negotiating", "accepted"].includes(deal.status);
  const completed = deal.status === "completed";
  const activityDate = completed ? deal.completedAt ?? deal.lastActivityAt : deal.lastActivityAt;

  return (
    <article className="mp-card relative p-3 sm:p-4" style={cardGlow}>
      {/* Kebab menu */}
      <div ref={menuRef} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Deal options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <EllipsisVertical size={15} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-8 w-44 overflow-hidden rounded-xl border border-card-border bg-card-bg py-1 shadow-xl"
          >
            <Link role="menuitem" href={roomHref} className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary">
              <ExternalLink size={13} /> Open Deal Room
            </Link>
            <Link
              role="menuitem"
              href={`/marketplace/messages?deal=${deal._id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary"
            >
              <MessageSquare size={13} /> Message {other.label}
            </Link>
            <Link
              role="menuitem"
              href={`/marketplace/listings/${deal.listing._id}`}
              className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary"
            >
              <Eye size={13} /> View Listing
            </Link>
            {canWithdraw && (
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onWithdraw(deal);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-bg-tertiary"
              >
                <Undo2 size={13} /> Withdraw Deal
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_200px] sm:gap-4">
        <Link href={roomHref} tabIndex={-1} aria-hidden="true">
          <DealPoster src={deal.listing.posterUrl} title={deal.listing.title} className="h-24 w-[72px] sm:h-28 sm:w-20" sizes="80px" />
        </Link>

        <div className="min-w-0 pr-7 sm:pr-0">
          <h3 className="truncate text-sm font-bold text-text-primary">
            <Link href={roomHref} className="hover:underline">
              {title}
            </Link>
          </h3>
          <dl className="mt-1 space-y-0.5 text-[11px]">
            <Meta label={other.label} value={other.name} />
            <Meta label="Deal Type" value={dealTypeLabel(deal.terms.dealType)} />
            <Meta label="Territory" value={territoryLabel(deal.terms.territory, true)} />
            <Meta label="Term" value={termLabel(deal.terms.termMonths)} />
          </dl>
          <p className="mt-1.5 text-base font-bold tabular-nums text-text-primary">{formatCents(deal.terms.amountCents)}</p>
        </div>

        <div className="col-span-2 flex flex-wrap items-end justify-between gap-2 border-t border-divider pt-2.5 sm:col-span-1 sm:flex-col sm:flex-nowrap sm:items-stretch sm:justify-start sm:border-l sm:border-t-0 sm:pl-4 sm:pr-6 sm:pt-0">
          <div className="min-w-0 space-y-1">
            <DealStatusBadge status={deal.status} />
            <p className="text-[10px] leading-relaxed text-text-tertiary">
              {completed ? "Completed on" : "Last activity"}
              <br />
              {formatDealDate(activityDate)}
              <br />
              <span className="text-text-secondary">{lastActivityText(deal, userId)}</span>
            </p>
          </div>
          <Link href={roomHref} className="mp-btn mp-btn-sm !h-8 !text-[11px] sm:mt-auto" style={accentOutline}>
            <ExternalLink size={12} aria-hidden="true" />
            Open Deal Room
          </Link>
        </div>
      </div>
    </article>
  );
}
