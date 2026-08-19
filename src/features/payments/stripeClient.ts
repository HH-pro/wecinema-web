/**
 * Shared Stripe.js loader.
 *
 * The publishable key is fetched at runtime from the backend rather than baked
 * in at build time, so a key rotation doesn't require a redeploy.
 *
 * Extracted from features/marketplace/components/buyer/PaymentModal.tsx so the
 * marketplace checkout and the rental checkout resolve the same memoised
 * promise — Stripe.js is ~230KB and must be loaded once per session, not once
 * per checkout surface.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripePromise = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = fetch(`${BASE_URL}/payments/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stripePublishableKey?: string } | null) => {
        const key = data?.stripePublishableKey;
        return key ? loadStripe(key) : null;
      })
      .catch(() => null);
  }
  return stripePromise;
};

export const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#FFBB00",
    borderRadius: "0.625rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};
