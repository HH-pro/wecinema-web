"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { toast } from "@/lib/toast";
import { DealFilmHeader } from "../components/DealFilmHeader";
import { DealPageHeader } from "../components/DealPageHeader";
import { DealEmptyState, DealRoomSkeleton } from "../components/DealStates";
import { DealStatusBadge } from "../components/DealStatusBadge";
import { DealTermsForm } from "../components/DealTermsForm";
import { OfferComparison } from "../components/OfferComparison";
import { useDeal, useDealActions } from "../hooks/useDeals";
import type { DealTerms } from "../types/deal.types";

export default function CounterOfferView({ dealId }: { dealId: string }) {
  const router = useRouter();
  const roomHref = `/marketplace/deal/${dealId}`;
  const { deal, setDeal, loading, error, notFound, refetch } = useDeal(dealId);
  const { busy, counter } = useDealActions(deal, setDeal, refetch);

  // undefined = untouched (show current amount); null = field empty/invalid.
  const [counterCents, setCounterCents] = useState<number | null | undefined>(undefined);
  const submittedRef = useRef(false);

  // Only the party whose turn it is may counter. After our own successful submit the
  // turn flips too, but that navigation is already under way.
  useEffect(() => {
    if (!deal || deal.isMyTurn || submittedRef.current) return;
    toast.error(
      deal.isOpen && (deal.status === "pending" || deal.status === "negotiating")
        ? "You're waiting on the other party to respond."
        : "This deal can't be countered anymore.",
    );
    router.replace(roomHref);
  }, [deal, router, roomHref]);

  const handleSubmit = async (terms: DealTerms) => {
    submittedRef.current = true;
    const updated = await counter(terms);
    if (updated) router.push(roomHref);
    else submittedRef.current = false;
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
              title="Counter Offer"
              subtitle="Adjust the deal terms and send a revised proposal."
              backHref={roomHref}
            />
            <DealFilmHeader deal={deal} badge={<DealStatusBadge status={deal.status} />} />
            <OfferComparison
              currentCents={deal.terms.amountCents}
              counterCents={counterCents === undefined ? deal.terms.amountCents : counterCents}
            />
            <DealTermsForm
              // Remount with fresh values if the terms change underneath us (stale refetch).
              key={deal.proposalCount}
              initialTerms={deal.terms}
              unchangedFrom={deal.terms}
              title="Counter Offer Terms"
              submitLabel="Send Counter Offer"
              busy={busy === "counter"}
              onAmountChange={setCounterCents}
              onSubmit={handleSubmit}
              onCancel={() => router.push(roomHref)}
              footnote="Your counter offer will be sent securely through WeCinema."
            />
          </>
        )}
      </div>
    </MarketplaceLayout>
  );
}
