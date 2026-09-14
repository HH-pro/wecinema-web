"use client";

import { useCallback, useState } from "react";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { DealActions } from "../components/DealActions";
import { DealConfirmModal } from "../components/DealConfirmModal";
import { DealFilmHeader } from "../components/DealFilmHeader";
import { DealPageHeader } from "../components/DealPageHeader";
import { DealPayPanel } from "../components/DealPayPanel";
import { DealEmptyState, DealRoomSkeleton } from "../components/DealStates";
import { DealStatTiles } from "../components/DealStatTiles";
import { DealStatusBadge } from "../components/DealStatusBadge";
import { DealTermsTable } from "../components/DealTermsTable";
import { OfferHistoryTimeline } from "../components/OfferHistoryTimeline";
import { useDeal, useDealActions } from "../hooks/useDeals";
import { counterparty, formatCents } from "../lib/dealFormat";

type Pending = "accept" | "decline" | "withdraw" | null;

export default function DealRoomView({ dealId }: { dealId: string }) {
  const { deal, setDeal, loading, error, notFound, refetch } = useDeal(dealId);
  const { busy, accept, decline, cancel } = useDealActions(deal, setDeal, refetch);
  const [pending, setPending] = useState<Pending>(null);

  const closeModal = useCallback(() => setPending(null), []);

  const handleConfirm = async (reason?: string) => {
    const action = pending;
    const result =
      action === "accept" ? await accept() : action === "decline" ? await decline(reason) : await cancel(reason);
    // Close on success; on a stale-state error the deal has been refetched, so the
    // modal's premise may no longer hold either.
    if (result || action) setPending(null);
  };

  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        {loading && !deal ? (
          <DealRoomSkeleton />
        ) : !deal ? (
          <DealEmptyState
            title={notFound ? "Deal not found" : "Couldn't load this deal"}
            text={notFound ? "This deal doesn't exist or you aren't part of it." : error ?? "Please try again."}
            action={{ href: "/marketplace/deals", label: "Back to My Deals" }}
          />
        ) : (
          <>
            <DealPageHeader
              title="Deal Room"
              subtitle="Negotiate and finalize marketplace terms securely."
              backHref="/marketplace/deals"
              aside={<DealStatusBadge status={deal.status} />}
            />
            <DealFilmHeader deal={deal} />
            <DealStatTiles deal={deal} />
            <DealTermsTable terms={deal.terms} listingId={deal.listing._id} />
            <OfferHistoryTimeline proposals={deal.proposals ?? []} />
            <DealActions
              deal={deal}
              busy={busy}
              onAccept={() => setPending("accept")}
              onDecline={() => setPending("decline")}
              onWithdraw={() => setPending("withdraw")}
              paySlot={<DealPayPanel deal={deal} onPaid={refetch} />}
            />

            <DealConfirmModal
              open={pending === "accept"}
              title="Accept this offer?"
              description={
                <>
                  You&apos;re agreeing to <strong className="text-text-primary">{formatCents(deal.terms.amountCents)}</strong> on
                  the terms shown. {deal.viewerRole === "seller"
                    ? `${counterparty(deal).username} will then be asked to pay; funds are held in escrow until delivery.`
                    : "You'll be asked to pay next; funds are held in escrow until delivery."}
                </>
              }
              confirmLabel="Accept Offer"
              busy={busy === "accept"}
              onConfirm={handleConfirm}
              onClose={closeModal}
            />
            <DealConfirmModal
              open={pending === "decline"}
              title="Decline this offer?"
              description="This ends the negotiation for both sides."
              confirmLabel="Decline Offer"
              tone="danger"
              withReason
              busy={busy === "decline"}
              onConfirm={handleConfirm}
              onClose={closeModal}
            />
            <DealConfirmModal
              open={pending === "withdraw"}
              title="Withdraw this deal?"
              description="The deal will be closed for both sides. You can start a new one on this listing later."
              confirmLabel="Withdraw Deal"
              tone="danger"
              withReason
              busy={busy === "cancel"}
              onConfirm={handleConfirm}
              onClose={closeModal}
            />
          </>
        )}
      </div>
    </MarketplaceLayout>
  );
}
