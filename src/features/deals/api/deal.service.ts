"use client";

/**
 * Deal API Service — Wecinema Marketplace
 * Base path: /marketplace/deals
 */

import { api } from "@/features/auth/services/apiClient";
import { toBody } from "@/lib/api/serialize";
import type {
  AcceptDealPayload,
  CancelDealPayload,
  ConfirmDealPaymentResponse,
  CounterDealPayload,
  CreateDealPayload,
  DealPaymentIntentResponse,
  DealResponse,
  DealStatsResponse,
  DeclineDealPayload,
  ListDealsParams,
  ListDealsResponse,
} from "../types/deal.types";

const BASE = "/marketplace/deals";

// ─── Reads ───────────────────────────────────────────────────

export function listDeals(params: ListDealsParams = {}): Promise<ListDealsResponse> {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.role && params.role !== "all") qs.set("role", params.role);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<ListDealsResponse>(`${BASE}${query ? `?${query}` : ""}`);
}

export function getDealStats(): Promise<DealStatsResponse> {
  return api.get<DealStatsResponse>(`${BASE}/stats`);
}

export function getDeal(id: string): Promise<DealResponse> {
  return api.get<DealResponse>(`${BASE}/${encodeURIComponent(id)}`);
}

// ─── Negotiation ─────────────────────────────────────────────

export function createDeal(payload: CreateDealPayload): Promise<DealResponse> {
  return api.post<DealResponse>(BASE, toBody(payload));
}

export function counterDeal(id: string, payload: CounterDealPayload): Promise<DealResponse> {
  return api.post<DealResponse>(`${BASE}/${encodeURIComponent(id)}/counter`, toBody(payload));
}

export function acceptDeal(id: string, payload: AcceptDealPayload): Promise<DealResponse> {
  return api.post<DealResponse>(`${BASE}/${encodeURIComponent(id)}/accept`, toBody(payload));
}

export function declineDeal(id: string, payload: DeclineDealPayload): Promise<DealResponse> {
  return api.post<DealResponse>(`${BASE}/${encodeURIComponent(id)}/decline`, toBody(payload));
}

export function cancelDeal(id: string, payload: CancelDealPayload = {}): Promise<DealResponse> {
  return api.post<DealResponse>(`${BASE}/${encodeURIComponent(id)}/cancel`, toBody(payload));
}

// ─── Payment ─────────────────────────────────────────────────

export function createDealPaymentIntent(id: string): Promise<DealPaymentIntentResponse> {
  return api.post<DealPaymentIntentResponse>(`${BASE}/${encodeURIComponent(id)}/payment-intent`, {});
}

export function confirmDealPayment(id: string, paymentIntentId: string): Promise<ConfirmDealPaymentResponse> {
  return api.post<ConfirmDealPaymentResponse>(
    `${BASE}/${encodeURIComponent(id)}/confirm-payment`,
    { paymentIntentId },
  );
}
