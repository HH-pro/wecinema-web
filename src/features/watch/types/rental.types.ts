/** Client-side shapes for the video rental flow. */

export interface RentalTerms {
  /** Days from purchase in which playback must begin. */
  windowDays: number;
  /** Hours the rental stays open once playback first starts. */
  playWindowHours: number;
}

export interface RentalSummary {
  _id: string;
  status: "pending" | "active" | "expired" | "failed" | "refunded" | "disputed";
  amountCents: number;
  currency: string;
  paidAt: string | null;
  firstPlayedAt: string | null;
  purchaseExpiresAt: string | null;
  expiresAt: string | null;
  windowDays: number;
  playWindowHours: number;
  msRemaining: number | null;
}

export type EntitlementReason =
  | "not_gated"
  | "author"
  | "admin"
  | "rented"
  | "not_rented"
  | "expired"
  | "anonymous";

export interface EntitlementResponse {
  success: boolean;
  gated: boolean;
  entitled: boolean;
  reason: EntitlementReason;
  priceCents?: number;
  currency?: string;
  terms?: RentalTerms;
  rental?: RentalSummary | null;
}

export interface RentalCheckoutResponse {
  success: boolean;
  rentalId: string;
  /** Null for test-account checkouts, which skip Stripe. */
  clientSecret: string | null;
  /** Test-payment account: no card form; confirming activates the rental. */
  testMode?: boolean;
  amountCents: number;
  currency: string;
  video: { _id: string; title: string };
  terms: RentalTerms;
  reused?: boolean;
}

export interface StreamRendition {
  quality: string;
  bitrate?: number;
  url: string;
}

export interface StreamGrantResponse {
  success: boolean;
  url: string;
  /** When the signed URL stops working — refresh before this. */
  urlExpiresAt: string;
  renditions: StreamRendition[];
  rental: RentalSummary | null;
}

export interface MyRental extends RentalSummary {
  isActive: boolean;
  video: {
    _id: string;
    title?: string;
    slug?: string;
    duration?: number;
    thumbnail: string | null;
  };
  watchUrl: string | null;
}
