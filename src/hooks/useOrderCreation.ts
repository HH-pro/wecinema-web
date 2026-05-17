"use client";
/**
 * src/hooks/useOrderCreation.ts
 *
 * Handles async operations needed by OrderCreation.tsx:
 *   1. Check Stripe account status on mount
 *   2. createOrder() mutation
 */

import { useCallback, useEffect, useState } from "react";
import { api } from "@/features/auth/services/apiClient";

// ─── Types ────────────────────────────────────────────────────

export interface StripeStatus {
  connected: boolean;
  status:    string;
}

export interface CreateOrderPayload {
  offerId:              string;
  listingId:            string;
  buyerId:              string;
  sellerId:             string;
  amount:               number;
  shippingAddress:      string;
  paymentMethod:        string;
  notes:                string;
  expectedDeliveryDays: number;
}

interface UseOrderCreationReturn {
  stripeStatus:  StripeStatus | null;
  stripeLoading: boolean;
  createOrder:   (payload: CreateOrderPayload) => Promise<unknown | null>;
  loading:       boolean;
  error:         string | null;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useOrderCreation(): UseOrderCreationReturn {
  const [stripeStatus,  setStripeStatus]  = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const checkStripe = useCallback(async () => {
    setStripeLoading(true);
    try {
      const res: any = await api.get("/payment/stripe/account-status");
      setStripeStatus(res);
    } catch {
      setStripeStatus({ connected: false, status: "unknown" });
    } finally {
      setStripeLoading(false);
    }
  }, []);

  useEffect(() => { checkStripe(); }, [checkStripe]);

  const createOrder = useCallback(async (
    payload: CreateOrderPayload
  ): Promise<unknown | null> => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.post("/marketplace/orders/create", payload as unknown as Record<string, unknown>);
      if (res.success) return res.order ?? res;
      if (res.stripeSetupRequired) {
        setError("Stripe account setup required. Please connect your Stripe account.");
      } else {
        setError(res.error ?? "Failed to create order");
      }
      return null;
    } catch (err: unknown) {
      const apiError = (err as any)?.response?.data;
      if (apiError?.stripeSetupRequired) {
        setError("Stripe account setup required. Please connect your Stripe account.");
      } else {
        setError(
          apiError?.error ??
          (err instanceof Error ? err.message : "Failed to create order. Please try again.")
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { stripeStatus, stripeLoading, createOrder, loading, error };
}
