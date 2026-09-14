"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Undo2,
  X,
} from "lucide-react";
import { accentOutline } from "./styles";
import { counterparty, formatCents } from "../lib/dealFormat";
import type { DealAction } from "../hooks/useDeals";
import type { Deal } from "../types/deal.types";

interface DealActionsProps {
  deal: Deal;
  busy: DealAction | null;
  onAccept: () => void;
  onDecline: () => void;
  onWithdraw: () => void;
  /** Payment button for the buyer once terms are accepted. */
  paySlot?: ReactNode;
}

export function DealActions({ deal, busy, onAccept, onDecline, onWithdraw, paySlot }: DealActionsProps) {
  const other = counterparty(deal);
  const otherRole = deal.viewerRole === "buyer" ? "Seller" : "Buyer";
  const negotiating = deal.status === "pending" || deal.status === "negotiating";
  const isBuyer = deal.viewerRole === "buyer";
  const canWithdraw = isBuyer && (negotiating || deal.status === "accepted");
  const icon = (action: DealAction, fallback: ReactNode) =>
    busy === action ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : fallback;

  const withdrawButton = canWithdraw && (
    <button
      type="button"
      onClick={onWithdraw}
      disabled={!!busy}
      className="mp-btn mp-btn-ghost mp-btn-sm !h-8 flex-shrink-0 !text-[11px] text-danger"
    >
      {icon("cancel", <Undo2 size={13} aria-hidden="true" />)}
      Withdraw
    </button>
  );

  return (
    <div className="space-y-2.5">
      {negotiating && deal.isMyTurn && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onAccept} disabled={!!busy} className="mp-btn mp-btn-primary !h-10 !gap-1.5 !px-2 !text-xs sm:!text-sm">
            {icon("accept", <CheckCircle2 size={14} aria-hidden="true" />)}
            Accept Offer
          </button>
          <Link
            href={`/marketplace/deal/${deal._id}/counter`}
            aria-disabled={!!busy}
            className={`mp-btn !h-10 !gap-1.5 !px-2 !text-xs sm:!text-sm ${busy ? "pointer-events-none opacity-50" : ""}`}
            style={accentOutline}
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            Counter Offer
          </Link>
          <button
            type="button"
            onClick={onDecline}
            disabled={!!busy}
            className="mp-btn !h-10 !gap-1.5 !px-2 !text-xs sm:!text-sm"
            style={accentOutline}
          >
            {icon("decline", <X size={14} aria-hidden="true" />)}
            Decline
          </button>
        </div>
      )}

      {negotiating && !deal.isMyTurn && (
        <div className="mp-action-panel mp-action-panel-info flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs">
            <Clock size={14} className="flex-shrink-0" aria-hidden="true" />
            Waiting for {other.username} to respond to your {deal.proposalCount > 1 ? "counter offer" : "offer"}.
          </p>
          {withdrawButton}
        </div>
      )}

      {deal.status === "accepted" &&
        (isBuyer ? (
          <div className="mp-action-panel mp-action-panel-warning space-y-2.5">
            <p className="text-xs">
              <strong>Offer accepted.</strong> Pay {formatCents(deal.terms.amountCents)} to secure this deal. Funds are
              held in escrow and only released to {other.username} after delivery.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {paySlot}
              {withdrawButton}
            </div>
          </div>
        ) : (
          <div className="mp-action-panel mp-action-panel-info">
            <p className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} className="flex-shrink-0" aria-hidden="true" />
              You accepted these terms. Waiting for {other.username} to complete payment.
            </p>
          </div>
        ))}

      {(deal.status === "paid" || deal.status === "completed") && (
        <div className="mp-action-panel mp-action-panel-success flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs">
            <ShieldCheck size={14} className="flex-shrink-0" aria-hidden="true" />
            {deal.status === "completed"
              ? "Agreement finalized. This deal is complete."
              : "Payment secured in escrow. Delivery continues on the order."}
          </p>
          {deal.orderId && (
            <Link href={`/marketplace/orders/${deal.orderId}`} className="mp-btn mp-btn-sm !h-8 flex-shrink-0 !text-[11px]" style={accentOutline}>
              View Order <ExternalLink size={12} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {(deal.status === "declined" || deal.status === "cancelled" || deal.status === "expired") && (
        <div className="mp-action-panel mp-action-panel-danger">
          <p className="flex items-start gap-2 text-xs">
            <Ban size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
            <span>
              {deal.status === "declined" && "This offer was declined."}
              {deal.status === "cancelled" && "This deal was withdrawn."}
              {deal.status === "expired" && "This deal expired without agreement."}
              {deal.declineReason && <span className="mt-1 block opacity-80">Reason: {deal.declineReason}</span>}
            </span>
          </p>
        </div>
      )}

      <Link href={`/marketplace/messages?deal=${deal._id}`} className="mp-btn mp-btn-secondary !h-10 w-full !text-xs sm:!text-sm">
        <MessageSquare size={14} aria-hidden="true" />
        Message {otherRole}
      </Link>
    </div>
  );
}
