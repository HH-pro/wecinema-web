/**
 * Conversion tracking — GA4 + Meta Pixel.
 *
 * Both tags were installed but only ever fired PageView, so nothing downstream
 * of a visit was measurable: you could see sessions on a landing page but not
 * whether anyone signed up, listed, or paid. These helpers emit the standard
 * event on both platforms from one call.
 *
 * Every helper is safe to call anywhere: it no-ops on the server, and no-ops in
 * the browser until the tags have loaded (they load `afterInteractive`, and the
 * Pixel deliberately never loads on private routes). Tracking must never be
 * able to break a signup or a checkout, so nothing here throws.
 */

type Params = Record<string, unknown>;

function gtagEvent(event: string, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  try {
    w.gtag?.("event", event, params);
  } catch {
    /* analytics must never break the flow it is measuring */
  }
}

function fbqEvent(event: string, params: Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", event, params);
  } catch {
    /* see above */
  }
}

/** A visitor completed registration. */
export function trackSignUp(method: "email" | "google"): void {
  gtagEvent("sign_up", { method });
  fbqEvent("CompleteRegistration", { method });
}

/** A seller published a marketplace listing — the supply-side conversion. */
export function trackListingCreated(params: {
  listingId?: string;
  type?: string;
  price?: number;
  currency?: string;
}): void {
  gtagEvent("listing_created", {
    item_id: params.listingId,
    item_category: params.type,
    value: params.price,
    currency: params.currency ?? "USD",
  });
  fbqEvent("SubmitApplication", {
    content_ids: params.listingId ? [params.listingId] : undefined,
    content_type: params.type,
    value: params.price,
    currency: params.currency ?? "USD",
  });
}

/** A subscription was paid for. */
export function trackSubscription(params: {
  plan: string;
  value: number;
  currency?: string;
}): void {
  gtagEvent("purchase", {
    transaction_id: `sub_${params.plan}_${Date.now()}`,
    value: params.value,
    currency: params.currency ?? "USD",
    items: [{ item_id: params.plan, item_name: `${params.plan} plan`, price: params.value }],
  });
  fbqEvent("Subscribe", {
    value: params.value,
    currency: params.currency ?? "USD",
    predicted_ltv: params.value * 12,
  });
}

/** A marketplace order was placed — the demand-side conversion. */
export function trackPurchase(params: {
  orderId?: string;
  listingId?: string;
  value: number;
  currency?: string;
}): void {
  gtagEvent("purchase", {
    transaction_id: params.orderId,
    value: params.value,
    currency: params.currency ?? "USD",
    items: params.listingId ? [{ item_id: params.listingId }] : undefined,
  });
  fbqEvent("Purchase", {
    content_ids: params.listingId ? [params.listingId] : undefined,
    value: params.value,
    currency: params.currency ?? "USD",
  });
}

/** A visitor started checkout but has not paid yet. */
export function trackBeginCheckout(params: {
  plan?: string;
  value?: number;
  currency?: string;
}): void {
  gtagEvent("begin_checkout", {
    value: params.value,
    currency: params.currency ?? "USD",
    items: params.plan ? [{ item_id: params.plan }] : undefined,
  });
  fbqEvent("InitiateCheckout", {
    value: params.value,
    currency: params.currency ?? "USD",
  });
}
