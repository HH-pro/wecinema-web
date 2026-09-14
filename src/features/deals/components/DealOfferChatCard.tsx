"use client";

import Link from "next/link";
import { ArrowLeftRight, CalendarDays, DollarSign, ExternalLink, FileText, Globe } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DealPoster } from "./DealPoster";
import { DealStatusBadge } from "./DealStatusBadge";
import { accentOutline } from "./styles";
import {
  dealTypeLabel,
  formatCents,
  isNegotiationOpen,
  termLabel,
  territoryLabel,
} from "../lib/dealFormat";
import type { ChatDealSummary, DealChatMessageMeta, DealEvent } from "../types/deal.types";

const HEADLINE: Record<DealEvent, (name: string) => string> = {
  offer:     (n) => `${n} sent an offer`,
  counter:   (n) => `${n} sent a counter offer`,
  revised:   (n) => `${n} submitted a revised offer`,
  accepted:  (n) => `${n} accepted the offer`,
  declined:  (n) => `${n} declined the offer`,
  cancelled: (n) => `${n} withdrew the deal`,
  paid:      ()  => "Payment secured in escrow",
  completed: ()  => "Deal completed",
  expired:   ()  => "Deal expired",
};

const SUBLINE: Partial<Record<DealEvent, string>> = {
  offer:    "A new offer has been made. Review the details below to continue the negotiation.",
  counter:  "The terms were revised. Review the details below to continue the negotiation.",
  revised:  "The terms were revised. Review the details below to continue the negotiation.",
  accepted: "Both sides agreed on these terms. The buyer can now complete payment.",
  paid:     "Funds are held in escrow until delivery is confirmed.",
};

interface DealOfferChatCardProps {
  meta: DealChatMessageMeta;
  /** Live deal summary from the chat list — used for current status and turn. */
  deal?: ChatDealSummary | null;
  currentUserId?: string;
  timestamp?: Date;
}

/**
 * Deal event rendered inside a chat thread. Display-only: its buttons open the
 * deal pages, where the server enforces who may act.
 */
export function DealOfferChatCard({ meta, deal, currentUserId, timestamp }: DealOfferChatCardProps) {
  const status = deal?.status ?? meta.dealStatus;
  const isProposal = meta.event === "offer" || meta.event === "counter" || meta.event === "revised";
  const fromOther = !!currentUserId && meta.actorId !== currentUserId;
  const canCounter = isProposal && fromOther && isNegotiationOpen(status) && (deal ? deal.isMyTurn : true);
  const headline = (HEADLINE[meta.event] ?? HEADLINE.offer)(meta.actorName || "Someone");
  const subline = SUBLINE[meta.event];

  const facts = [
    { icon: <FileText size={12} />, label: "Deal Type", value: dealTypeLabel(meta.dealType) },
    { icon: <Globe size={12} />, label: "Territory", value: territoryLabel(meta.territory, true) },
    { icon: <CalendarDays size={12} />, label: "Term Length", value: termLabel(meta.termMonths) },
    { icon: <DollarSign size={12} />, label: "Offer Amount", value: formatCents(meta.amountCents) },
  ];

  return (
    <div className="my-3 flex justify-start">
      <div
        className="w-full max-w-md rounded-2xl border p-3 sm:p-4"
        style={{
          borderColor: "var(--color-accent-primary)",
          backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 4%, var(--color-bg-elevated))",
        }}
      >
        <div className="flex items-start gap-2.5">
          <Avatar username={meta.actorName || "WeCinema"} size={26} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-text-primary">{headline}</p>
              {timestamp && (
                <time className="flex-shrink-0 text-[10px] text-text-tertiary">
                  {timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              )}
            </div>
            {subline && <p className="mt-0.5 text-[11px] text-text-tertiary">{subline}</p>}
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <DealPoster src={deal?.posterUrl} title={meta.listingTitle || deal?.title || "Deal"} className="h-16 w-14" sizes="56px" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-xs font-bold text-text-primary">{meta.listingTitle || deal?.title}</p>
              <DealStatusBadge status={status} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 min-[440px]:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="flex items-center gap-1 text-[9px] text-text-tertiary">
                    <span aria-hidden="true">{f.icon}</span>
                    {f.label}
                  </dt>
                  <dd className="truncate text-[11px] font-semibold text-text-primary">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className={`mt-3 grid gap-2 ${canCounter ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link href={`/marketplace/deal/${meta.dealId}`} className="mp-btn mp-btn-sm !h-8 !text-[11px]" style={accentOutline}>
            <ExternalLink size={12} aria-hidden="true" />
            View Deal Room
          </Link>
          {canCounter && (
            <Link href={`/marketplace/deal/${meta.dealId}/counter`} className="mp-btn mp-btn-primary mp-btn-sm !h-8 !text-[11px]">
              <ArrowLeftRight size={12} aria-hidden="true" />
              Counter Offer
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
