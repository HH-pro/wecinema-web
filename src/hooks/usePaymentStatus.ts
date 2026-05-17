"use client";

/**
 * usePaymentStatus — fetches and polls payment status for a given orderId.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/features/auth/services/apiClient";

export interface PaymentIntentSnapshot {
  status:   string;
  amount:   number;
  currency: string;
  created:  number;
}

export interface PaymentStatusData {
  orderStatus:     string;
  paymentIntent:   PaymentIntentSnapshot | null;
  paymentReleased: boolean;
  releaseDate:     string | null;
}

interface UsePaymentStatusReturn {
  status:  PaymentStatusData | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function usePaymentStatus(orderId: string): UsePaymentStatusReturn {
  const [status,  setStatus]  = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const hasFetchedRef = useRef(false);
  const isMounted     = useRef(true);

  const fetch = useCallback(async () => {
    if (!orderId) return;
    if (!hasFetchedRef.current) setLoading(true);

    try {
      const res = await api.get<{ success: true; data: PaymentStatusData }>(`/payment/status/${orderId}`);
      if (!isMounted.current) return;
      if (res.success && res.data) {
        setStatus(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch payment status");
    } finally {
      if (isMounted.current) {
        setLoading(false);
        hasFetchedRef.current = true;
      }
    }
  }, [orderId]);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, [fetch]);

  return { status, loading, error, refetch: fetch };
}
