// ============================================================
// Stripe Types — Wecinema Marketplace
// Mirrors backend marketplace/stripe.js
// Mounted at: /api/marketplace/stripe
// ============================================================

// ─── Account ─────────────────────────────────────────────────

export type StripeAccountStatus =
  | "not_connected"
  | "pending"
  | "verification_in_progress"
  | "active"
  | "account_invalid"
  | "account_not_found"
  | "unknown";

export interface StripeRequirements {
  currentlyDue: string[];
  pendingVerification: string[];
  disabledReason?: string;
}

export interface StripeBalance {
  available: number;    // cents
  pending: number;      // cents
  currency: string;
}

// ─── Payout ──────────────────────────────────────────────────

export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "canceled";

export interface Payout {
  id: string;
  payoutId: string;
  amount: number;         // dollars
  formattedAmount: string;
  currency: string;
  status: PayoutStatus;
  statusColor?: string;
  method: string;
  arrivalDate?: string;
  createdAt: string;
  failureMessage?: string;
}

// ─── Request Payloads ────────────────────────────────────────

export interface WithdrawPayload {
  amount: number;         // dollars — min 1, max 100,000
  currency?: "usd" | "eur" | "gbp";
}

export interface StripeCreatePaymentIntentPayload {
  orderId: string;
}

export interface StripeConfirmPaymentPayload {
  paymentIntentId: string;
}

// ─── Response Shapes ─────────────────────────────────────────

export interface GetStatusResponse {
  success: true;
  data: {
    connected: boolean;
    status: StripeAccountStatus;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    cached?: boolean;
    accountId?: string;
    email?: string;
    name?: string;
    country?: string;
    requirements?: StripeRequirements;
  };
}

export interface OnboardSellerResponse {
  success: true;
  data: {
    url: string;
    accountId: string;
    status: "new" | "existing_incomplete";
    message: string;
  };
}

export interface ContinueOnboardingResponse {
  success: true;
  data: {
    url: string;
    accountId: string;
    status: "verification_in_progress";
    requirements: { currentlyDue: string[]; pendingVerification: string[] };
  };
}

export interface AccountStatusResponse {
  success: true;
  data: {
    account: {
      id: string;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      country: string;
      defaultCurrency: string;
      requirements: Record<string, unknown>;
      balance: StripeBalance | null;
    } | null;
    status: {
      isActive: boolean;
      canReceivePayments: boolean;
      canSendPayouts?: boolean;
      needsAction: boolean;
      missingRequirements: string[];
    };
    message: string;
  };
}

export interface BalanceResponse {
  success: true;
  data: {
    available: number;
    pending: number;
    total: number;
    currency: string;
    formatted: { available: string; pending: string };
  };
}

export interface WithdrawResponse {
  success: true;
  data: {
    payoutId: string;
    recordId: string;
    amount: number;
    currency: string;
    status: PayoutStatus;
    estimatedArrival?: string;
    isDuplicate?: boolean;
  };
}

export interface GetPayoutsResponse {
  success: true;
  data: {
    payouts: Payout[];
    count: number;
    totalProcessed: number;
  };
}

export interface StripePaymentIntentResponse {
  success: true;
  data: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    platformFee: number;
    currency: string;
  };
}

export interface StripeConfirmPaymentResponse {
  success: true;
  data: {
    paymentStatus: string;
    orderStatus: string;
    amount: number;
    currency: string;
  };
}

export interface LoginLinkResponse {
  success: true;
  data: { url: string; expiresAt: number };
}

export interface DisconnectResponse {
  success: true;
  message: string;
  data: { status: "pending_review"; estimatedReviewTime: string };
}