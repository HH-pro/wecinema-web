"use client";

/**
 * Offer API Service — Wecinema Marketplace
 * Base path: /marketplace/offers
 */

import { api } from "@/features/auth/services/apiClient";
import { toBody } from "@/lib/api/serialize";
import type {
  MakeOfferPayload,
  MakeOfferResponse,
  ConfirmOfferPaymentPayload,
  ConfirmOfferPaymentResponse,
  CancelTempOfferPayload,
  CreateDirectPaymentPayload,
  CreateDirectPaymentResponse,
  GetOfferResponse,
  GetOffersResponse,
  AcceptOfferResponse,
  RejectOfferPayload,
  RejectOfferResponse,
  CancelOfferResponse,
  OfferStatsResponse,
  HealthCheckResponse,
  GenericOfferResponse,
  DeleteAllOffersPayload,
} from "@/types/offer.types";

const BASE = "/marketplace/offers";

// ─── Payment Flow ─────────────────────────────────────────────

export function makeOffer(payload: MakeOfferPayload): Promise<MakeOfferResponse> {
  return api.post<MakeOfferResponse>(`${BASE}/make-offer`, toBody(payload));
}

export function confirmOfferPayment(payload: ConfirmOfferPaymentPayload): Promise<ConfirmOfferPaymentResponse> {
  return api.post<ConfirmOfferPaymentResponse>(`${BASE}/confirm-offer-payment`, toBody(payload));
}

export function cancelTempOffer(payload: CancelTempOfferPayload): Promise<GenericOfferResponse> {
  return api.post<GenericOfferResponse>(`${BASE}/cancel-temp-offer`, toBody(payload));
}

export function createDirectPayment(payload: CreateDirectPaymentPayload): Promise<CreateDirectPaymentResponse> {
  return api.post<CreateDirectPaymentResponse>(`${BASE}/create-direct-payment`, toBody(payload));
}

// ─── Reads ───────────────────────────────────────────────────

export function getReceivedOffers(): Promise<GetOffersResponse> {
  return api.get<GetOffersResponse>(`${BASE}/received-offers`);
}

export function getMyOffers(): Promise<GetOffersResponse> {
  return api.get<GetOffersResponse>(`${BASE}/my-offers`);
}

export function getOffer(id: string): Promise<GetOfferResponse> {
  return api.get<GetOfferResponse>(`${BASE}/${id}`);
}

export function getOfferStats(): Promise<OfferStatsResponse> {
  return api.get<OfferStatsResponse>(`${BASE}/stats/overview`);
}

export function healthCheck(): Promise<HealthCheckResponse> {
  return api.get<HealthCheckResponse>(`${BASE}/health`);
}

// ─── Seller Actions ──────────────────────────────────────────

export function acceptOffer(id: string): Promise<AcceptOfferResponse> {
  return api.put<AcceptOfferResponse>(`${BASE}/accept-offer/${id}`, {});
}

export function rejectOffer(id: string, payload?: RejectOfferPayload): Promise<RejectOfferResponse> {
  return api.put<RejectOfferResponse>(`${BASE}/reject-offer/${id}`, toBody(payload ?? {}));
}

// ─── Buyer Actions ───────────────────────────────────────────

export function cancelOffer(id: string): Promise<CancelOfferResponse> {
  return api.put<CancelOfferResponse>(`${BASE}/cancel-offer/${id}`, {});
}

// ─── Admin ───────────────────────────────────────────────────

export function adminCleanupTempOffers(): Promise<{ success: true; message: string; data: { cleaned: number } }> {
  return api.post<{ success: true; message: string; data: { cleaned: number } }>(`${BASE}/cleanup-temp-offers`, {});
}

export function adminDeleteAllOffers(payload: DeleteAllOffersPayload): Promise<{ success: true; message: string; warning: string }> {
  return api.delete<{ success: true; message: string; warning: string }>(`${BASE}/delete-all-offers`);
}
