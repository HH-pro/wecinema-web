"use client";
/**
 * src/hooks/Useorderdetails.ts
 *
 * Manages fetch + status transitions for a single marketplace order.
 *
 *   useOrderDetails(orderId, isOpen) → {
 *     orderDetails, loading, error,
 *     refetch, updateStatus, updating
 *   }
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/features/auth/services/apiClient";

// ─── Types ────────────────────────────────────────────────────

export interface OrderDetailsData {
  _id:                    string;
  orderNumber?:           string;
  status:                 string;
  amount:                 number;
  platformFee?:           number;
  sellerAmount?:          number;
  paymentStatus:          string;
  orderType?:             string;
  requirements?:          string;
  buyerNotes?:            string;
  sellerNotes?:           string;
  deliveryMessage?:       string;
  deliveryFiles?:         string[];
  revisions?:             number;
  maxRevisions?:          number;
  expectedDelivery?:      string;
  stripePaymentIntentId?: string;
  stripeTransferId?:      string;
  paymentReleased?:       boolean;
  cancelReason?:          string;
  createdAt:              string;
  updatedAt:              string;
  paidAt?:                string;
  deliveredAt?:           string;
  completedAt?:           string;
  cancelledAt?:           string;
  buyerId?: {
    _id:        string;
    username:   string;
    avatar?:    string;
    email:      string;
    firstName?: string;
    lastName?:  string;
  };
  sellerId?: {
    _id:              string;
    username:         string;
    avatar?:          string;
    sellerRating?:    number;
    email:            string;
    firstName?:       string;
    lastName?:        string;
    stripeAccountId?: string;
  };
  listingId?: {
    _id:          string;
    title:        string;
    mediaUrls?:   string[];
    price:        number;
    currency?:    string;
    category?:    string;
    type?:        string;
    description?: string;
    tags?:        string[];
  };
  offerId?: {
    _id:               string;
    amount:            number;
    message?:          string;
    requirements?:     string;
    expectedDelivery?: string;
  };
}

// Map target status → correct seller API endpoint
const SELLER_STATUS_ENDPOINTS: Partial<Record<string, string>> = {
  processing:  "start-processing",
  in_progress: "start-work",
  cancelled:   "cancel-by-seller",
};

interface UseOrderDetailsReturn {
  orderDetails: OrderDetailsData | null;
  loading:      boolean;
  error:        string | null;
  refetch:      () => void;
  updateStatus: (newStatus: string) => Promise<boolean>;
  updating:     boolean;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useOrderDetails(
  orderId: string,
  isOpen:  boolean
): UseOrderDetailsReturn {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [updating,     setUpdating]     = useState(false);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/marketplace/orders/${orderId}`);
      if (!isMounted.current) return;
      const data = res?.order ?? res?.data?.order ?? res?.data ?? res;
      if (data?._id) {
        setOrderDetails(data);
      } else {
        setError(res?.error ?? "Failed to load order details");
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      setError(
        (err as any)?.response?.data?.error ??
        (err instanceof Error ? err.message : "Failed to load order details")
      );
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    isMounted.current = true;
    if (isOpen && orderId) fetch();
    return () => { isMounted.current = false; };
  }, [isOpen, orderId, fetch]);

  const updateStatus = useCallback(async (newStatus: string): Promise<boolean> => {
    if (!orderId || !orderDetails) return false;
    const endpoint = SELLER_STATUS_ENDPOINTS[newStatus];
    if (!endpoint) return false;

    const prevStatus = orderDetails.status;
    setUpdating(true);
    setOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));

    try {
      const res: any = await api.put(`/marketplace/orders/${orderId}/${endpoint}`);
      const ok = res?.success ?? true;
      if (!ok) {
        setOrderDetails((prev) => (prev ? { ...prev, status: prevStatus } : null));
        setError(res?.error ?? "Failed to update status");
        return false;
      }
      await fetch();
      return true;
    } catch (err: unknown) {
      setOrderDetails((prev) => (prev ? { ...prev, status: prevStatus } : null));
      setError(
        (err as any)?.response?.data?.error ??
        (err instanceof Error ? err.message : "Failed to update status")
      );
      return false;
    } finally {
      setUpdating(false);
    }
  }, [orderId, orderDetails, fetch]);

  return { orderDetails, loading, error, refetch: fetch, updateStatus, updating };
}
