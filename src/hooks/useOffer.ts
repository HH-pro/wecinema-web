"use client";
/**
 * Offer Hooks — Wecinema Marketplace
 *
 * useOfferPaymentFlow  — full 3-step offer payment (makeOffer → Stripe → confirm)
 * useDirectPayment     — buy at listed price
 * useMyOffers          — buyer's offer list
 * useReceivedOffers    — seller's incoming offers
 * useOffer             — single offer detail
 * useSellerOfferActions— accept / reject
 * useBuyerOfferActions — cancel
 * useOfferStats        — counts by status
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppError } from "@/features/auth/services/apiClient";
import * as offerService from "@/features/marketplace/api/offer.service";
import type {
  Offer,
  MakeOfferPayload,
  RejectOfferPayload,
  OfferStatsResponse,
  MakeOfferResponse,
  CreateDirectPaymentPayload,
} from "@/types/offer.types";

// ─── useOfferPaymentFlow ─────────────────────────────────────

type PaymentStep = "idle" | "creating" | "awaiting_stripe" | "confirming" | "done" | "error";

/**
 * Manages the complete offer payment lifecycle:
 *
 * Step 1 — Call `initiate(payload)` → creates PaymentIntent in Stripe
 *           and stores temp offer in Redis.
 *           You get back `clientSecret` to pass to Stripe.js.
 *
 * Step 2 — Let Stripe.js do confirmPayment(clientSecret).
 *           This happens entirely in the browser with Stripe Elements.
 *
 * Step 3 — After Stripe redirects/resolves, call `confirm(paymentIntentId)`.
 *           This tells the backend "payment succeeded, create the offer+order".
 *
 * Cancel — Call `abandon()` at any point before step 3 to void the
 *           temp offer and cancel the PaymentIntent.
 */
export function useOfferPaymentFlow() {
  const [step, setStep]         = useState<PaymentStep>("idle");
  const [error, setError]       = useState<string | null>(null);
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [tempOfferId, setTempOfferId]     = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [result, setResult]     = useState<MakeOfferResponse["data"] | null>(null);
  const [confirmed, setConfirmed] = useState<{ offerId: string; orderId: string } | null>(null);

  /** Step 1: create payment intent + temp offer in Redis */
  const initiate = useCallback(async (payload: MakeOfferPayload) => {
    setStep("creating");
    setError(null);
    try {
      const res = await offerService.makeOffer(payload);
      setClientSecret(res.data.clientSecret);
      setTempOfferId(res.data.tempOfferId);
      setPaymentIntentId(res.data.paymentIntentId);
      setResult(res.data);
      setStep("awaiting_stripe");
      return res.data;
    } catch (err) {
      setStep("error");
      setError(err instanceof AppError ? err.message : "Failed to initiate offer");
      return null;
    }
  }, []);

  /** Step 3: called after Stripe.js confirms payment */
  const confirm = useCallback(async (piId?: string) => {
    const intentId = piId ?? paymentIntentId;
    if (!intentId || !tempOfferId) {
      setError("Missing payment or offer ID");
      return null;
    }
    setStep("confirming");
    setError(null);
    try {
      const res = await offerService.confirmOfferPayment({
        paymentIntentId: intentId,
        tempOfferId,
      });
      setConfirmed({ offerId: res.data.offerId, orderId: res.data.orderId });
      setStep("done");
      return res.data;
    } catch (err) {
      setStep("error");
      setError(err instanceof AppError ? err.message : "Payment confirmation failed");
      return null;
    }
  }, [paymentIntentId, tempOfferId]);

  /** Cancel — called if user closes payment modal or navigates away */
  const abandon = useCallback(async () => {
    if (!tempOfferId && !paymentIntentId) return;
    try {
      await offerService.cancelTempOffer({
        tempOfferId: tempOfferId ?? undefined,
        paymentIntentId: paymentIntentId ?? undefined,
      });
    } catch {
      // Silent — best effort cleanup
    } finally {
      setStep("idle");
      setClientSecret(null);
      setTempOfferId(null);
      setPaymentIntentId(null);
      setResult(null);
    }
  }, [tempOfferId, paymentIntentId]);

  const reset = () => {
    setStep("idle");
    setError(null);
    setClientSecret(null);
    setTempOfferId(null);
    setPaymentIntentId(null);
    setResult(null);
    setConfirmed(null);
  };

  return {
    step,
    error,
    clientSecret,       // pass to Stripe Elements
    tempOfferId,
    paymentIntentId,
    result,             // raw make-offer response data
    confirmed,          // { offerId, orderId } after step 3
    initiate,
    confirm,
    abandon,
    reset,
    isLoading: step === "creating" || step === "confirming",
  };
}

// ─── useDirectPayment ────────────────────────────────────────

/**
 * Direct purchase at the listing's listed price.
 * Returns clientSecret for Stripe.js — no confirm step needed
 * (backend creates the order immediately at pending_payment status).
 */
export function useDirectPayment() {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [clientSecret, setSecret]   = useState<string | null>(null);
  const [orderId, setOrderId]       = useState<string | null>(null);
  const [chatId, setChatId]         = useState<string | null>(null);

  const initiate = useCallback(async (payload: CreateDirectPaymentPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await offerService.createDirectPayment(payload);
      setSecret(res.data.clientSecret);
      setOrderId(res.data.orderId);
      setChatId(res.data.chatId);
      return res.data;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to initiate payment");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, clientSecret, orderId, chatId, initiate };
}

// ─── useMyOffers ─────────────────────────────────────────────

export function useMyOffers() {
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await offerService.getMyOffers();
      if (!isMounted.current) return;
      setOffers(res.data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load offers");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line

  return { offers, loading, error, refetch: fetch };
}

// ─── useReceivedOffers ───────────────────────────────────────

export function useReceivedOffers() {
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await offerService.getReceivedOffers();
      if (!isMounted.current) return;
      setOffers(res.data);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load offers");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line

  return { offers, loading, error, refetch: fetch };
}

// ─── useOffer ────────────────────────────────────────────────

export function useOffer(id: string | undefined) {
  const [offer, setOffer]     = useState<Offer | null>(null);
  const [userRole, setRole]   = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!id) return () => { isMounted.current = false; };
    setLoading(true);
    offerService
      .getOffer(id)
      .then((res) => {
        if (!isMounted.current) return;
        setOffer(res.data as Offer);
        setRole(res.userRole);
      })
      .catch((err) => { if (isMounted.current) setError(err instanceof AppError ? err.message : "Failed to load offer"); })
      .finally(() => { if (isMounted.current) setLoading(false); });
    return () => { isMounted.current = false; };
  }, [id]);

  return { offer, userRole, loading, error };
}

// ─── useSellerOfferActions ───────────────────────────────────

export function useSellerOfferActions(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const r = await fn();
      onSuccess?.();
      return r;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Action failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,

    /** Accept a paid offer — triggers listing reservation + other offers rejected */
    accept: (id: string) =>
      wrap(() => offerService.acceptOffer(id)),

    /** Reject — if offer was paid, Stripe refund is issued automatically */
    reject: (id: string, payload?: RejectOfferPayload) =>
      wrap(() => offerService.rejectOffer(id, payload)),
  };
}

// ─── useBuyerOfferActions ────────────────────────────────────

export function useBuyerOfferActions(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const cancel = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await offerService.cancelOffer(id);
      onSuccess?.();
      return r;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to cancel offer");
      return null;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { cancel, loading, error };
}

// ─── useOfferStats ───────────────────────────────────────────

export function useOfferStats() {
  const [stats, setStats]     = useState<OfferStatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    offerService
      .getOfferStats()
      .then((r) => { if (isMounted.current) setStats(r.data); })
      .catch((err) => { if (isMounted.current) setError(err instanceof AppError ? err.message : "Failed to load stats"); })
      .finally(() => { if (isMounted.current) setLoading(false); });
    return () => { isMounted.current = false; };
  }, []);

  return { stats, loading, error };
}