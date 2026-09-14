"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { BillingDetails, PaymentStatus } from "@/features/marketplace/components/buyer/PaymentModal";
import { useDealPayment } from "../hooks/useDeals";
import { formatCents } from "../lib/dealFormat";
import type { Deal } from "../types/deal.types";

// Stripe Elements is ~230KB — only fetch it when the buyer actually starts paying.
const PaymentModal = dynamic(() => import("@/features/marketplace/components/buyer/PaymentModal"), { ssr: false });

interface DealPayPanelProps {
  deal: Deal;
  onPaid: () => void;
}

export function DealPayPanel({ deal, onPaid }: DealPayPanelProps) {
  const { authUser } = useAuth();
  const { clientSecret, starting, start, reset } = useDealPayment(deal._id);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [billing, setBilling] = useState<BillingDetails>(() => ({
    name: authUser?.username ?? "",
    email: authUser?.email ?? "",
    phone: "",
    address: { line1: "", city: "", state: "", postal_code: "", country: "US" },
  }));

  const onBillingChange = useCallback(
    (partial: Partial<BillingDetails>) => setBilling((prev) => ({ ...prev, ...partial })),
    [],
  );

  const handleClose = useCallback(() => {
    // The PaymentIntent stays open server-side and is reused on the next attempt.
    reset();
    setPaymentStatus("idle");
  }, [reset]);

  const handleSuccess = useCallback(() => {
    reset();
    setPaymentStatus("idle");
    onPaid();
  }, [reset, onPaid]);

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const data = await start();
          if (data?.testMode) onPaid();
        }}
        disabled={starting || !!clientSecret}
        className="mp-btn mp-btn-primary !h-9 !text-xs"
      >
        {starting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CreditCard size={14} aria-hidden="true" />}
        Pay {formatCents(deal.terms.amountCents)}{authUser?.isTestAccount ? " (test)" : ""}
      </button>

      {clientSecret && (
        <PaymentModal
          show
          clientSecret={clientSecret}
          offerData={{
            type: "deal",
            dealId: deal._id,
            amount: deal.terms.amountCents / 100,
            clientSecret,
          }}
          onClose={handleClose}
          onSuccess={handleSuccess}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          billingDetails={billing}
          onBillingDetailsChange={onBillingChange}
          getThumbnailUrl={() => deal.listing.posterUrl ?? ""}
        />
      )}
    </>
  );
}
