"use client";

/**
 * Stripe API Service + Hooks — Wecinema Marketplace
 * Base path: /marketplace/stripe
 */

import { useCallback, useEffect, useState } from "react";
import { api, AppError } from "@/features/auth/services/apiClient";
import type {
  GetStatusResponse,
  AccountStatusResponse,
  OnboardSellerResponse,
  ContinueOnboardingResponse,
  LoginLinkResponse,
  DisconnectResponse,
  BalanceResponse,
  WithdrawPayload,
  WithdrawResponse,
  GetPayoutsResponse,
  Payout,
  StripeCreatePaymentIntentPayload,
  StripePaymentIntentResponse,
  StripeConfirmPaymentPayload,
  StripeConfirmPaymentResponse,
} from "@/types/stripe.types";

const BASE = "/marketplace/stripe";

// ─── Service ─────────────────────────────────────────────────

export function getStatus(): Promise<GetStatusResponse> {
  return api.get<GetStatusResponse>(`${BASE}/status`);
}

export function getAccountStatus(): Promise<AccountStatusResponse> {
  return api.get<AccountStatusResponse>(`${BASE}/account-status`);
}

export function onboardSeller(): Promise<OnboardSellerResponse> {
  return api.post<OnboardSellerResponse>(`${BASE}/onboard-seller`, {});
}

export function continueOnboarding(): Promise<ContinueOnboardingResponse> {
  return api.post<ContinueOnboardingResponse>(`${BASE}/continue-onboarding`, {});
}

export function createLoginLink(): Promise<LoginLinkResponse> {
  return api.post<LoginLinkResponse>(`${BASE}/create-login-link`, {});
}

export function disconnect(): Promise<DisconnectResponse> {
  return api.post<DisconnectResponse>(`${BASE}/disconnect`, {});
}

export function getBalance(): Promise<BalanceResponse> {
  return api.get<BalanceResponse>(`${BASE}/balance`);
}

export function withdraw(payload: WithdrawPayload): Promise<WithdrawResponse> {
  return api.post<WithdrawResponse>(`${BASE}/withdraw`, payload as unknown as Record<string, unknown>);
}

export function getPayouts(): Promise<GetPayoutsResponse> {
  return api.get<GetPayoutsResponse>(`${BASE}/payouts`);
}

export function createPaymentIntent(payload: StripeCreatePaymentIntentPayload): Promise<StripePaymentIntentResponse> {
  return api.post<StripePaymentIntentResponse>(`${BASE}/create-payment-intent`, payload as unknown as Record<string, unknown>);
}

export function confirmPayment(payload: StripeConfirmPaymentPayload): Promise<StripeConfirmPaymentResponse> {
  return api.post<StripeConfirmPaymentResponse>(`${BASE}/confirm-payment`, payload as unknown as Record<string, unknown>);
}

// ─── Hooks ───────────────────────────────────────────────────

export function useStripeAccount() {
  const [status, setStatus]     = useState<GetStatusResponse["data"] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStatus();
      setStatus(res.data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to load Stripe status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const isActive   = status?.connected && status?.chargesEnabled && status?.payoutsEnabled;
  const needsSetup = status?.connected === false || (status?.connected && !status?.chargesEnabled);

  return { status, isActive, needsSetup, loading, error, refetch: fetch };
}

export function useStripeOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async (fn: () => Promise<{ data: { url: string } }>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      window.location.href = res.data.url;
    } catch (err) {
      const message = err instanceof AppError ? err.message : "Failed to start onboarding";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    startOnboarding:    () => wrap(onboardSeller),
    resumeOnboarding:   () => wrap(continueOnboarding),
    openStripeDashboard: async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await createLoginLink();
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setError(err instanceof AppError ? err.message : "Failed to open Stripe dashboard");
      } finally {
        setLoading(false);
      }
    },
  };
}

export function useStripeBalance() {
  const [balance, setBalance]   = useState<BalanceResponse["data"] | null>(null);
  const [payouts, setPayouts]   = useState<Payout[]>([]);
  const [totalProcessed, setTotal] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, payRes] = await Promise.all([getBalance(), getPayouts()]);
      setBalance(balRes.data);
      setPayouts(payRes.data.payouts);
      setTotal(payRes.data.totalProcessed);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  return { balance, payouts, totalProcessed, loading, error, refetch: fetch };
}

export function useWithdraw(onSuccess?: () => void) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<WithdrawResponse["data"] | null>(null);

  const submit = useCallback(async (payload: WithdrawPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await withdraw(payload);
      setResult(res.data);
      onSuccess?.();
      return res.data;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Withdrawal failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { submit, result, loading, error };
}

export function useStripePayment() {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [clientSecret, setSecret] = useState<string | null>(null);
  const [piId, setPiId]           = useState<string | null>(null);
  const [done, setDone]           = useState(false);

  const initiate = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createPaymentIntent({ orderId });
      setSecret(res.data.clientSecret);
      setPiId(res.data.paymentIntentId);
      return res.data;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to create payment");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (paymentIntentId?: string) => {
    const intentId = paymentIntentId ?? piId;
    if (!intentId) { setError("Missing payment intent"); return null; }
    setLoading(true);
    setError(null);
    try {
      const res = await confirmPayment({ paymentIntentId: intentId });
      setDone(true);
      return res.data;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Payment verification failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [piId]);

  return { clientSecret, loading, error, done, initiate, verify };
}
