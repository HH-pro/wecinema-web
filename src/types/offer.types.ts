// ============================================================
// Offer Types — Wecinema Marketplace
// Mirrors backend marketplace/offerRoutes.js
// Mounted at: /api/offers  (or /marketplace/offers)
// ============================================================

// ─── Primitives ─────────────────────────────────────────────

export type OfferStatus =
  | "initializing"
  | "pending"
  | "pending_payment"
  | "paid"
  | "accepted"
  | "rejected"
  | "cancelled";

export type OfferUserRole = "buyer" | "seller";

// ─── Status History ──────────────────────────────────────────

export interface OfferStatusHistoryEntry {
  status: OfferStatus;
  changedBy?: string;
  changedAt: string;
  reason?: string;
}

// ─── Populated sub-docs ──────────────────────────────────────

export interface OfferUser {
  _id: string;
  username: string;
  avatar: string;
  email: string;
  rating?: number;
}

export interface OfferListing {
  _id: string;
  title: string;
  price: number;
  mediaUrls?: string[];
  status?: string;
  sellerId?: string;
}

export interface OfferOrder {
  _id: string;
  status: string;
  paidAt?: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface OfferChatRoom {
  _id: string;
  firebaseChatId: string | null;
  status: string;
  chatLink: string | null;
}

// ─── Offer ───────────────────────────────────────────────────

export interface Offer {
  _id: string;
  buyerId: OfferUser | string;
  sellerId?: string;
  listingId: OfferListing | string;
  amount: number;               // in cents
  currency: string;
  originalPrice?: number;       // in cents
  message?: string;
  requirements?: string;
  expectedDelivery?: string;
  paymentIntentId?: string;
  status: OfferStatus;
  statusHistory: OfferStatusHistoryEntry[];
  rejectionReason?: string;
  orderId?: string;
  paidAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
  // ipAddress and userAgent are stripped server-side
}

// ─── Temp Offer ──────────────────────────────────────────────

/** Stored in Redis for 1 hour, never persisted to MongoDB */
export interface TempOffer {
  id: string;                   // format: temp_\d+_[a-f0-9]{16}
  buyerId: string;
  listingId: string;
  sellerId: string;
  amount: number;               // dollars
  amountInCents: number;
  message?: string;
  requirements?: string;
  expectedDelivery?: string | null;
  paymentIntentId: string;
  listingTitle: string;
  createdAt: number;            // timestamp
  expiresAt: number;            // timestamp
}

// ─── Financial ───────────────────────────────────────────────

export interface OfferAmountDetails {
  amount: number;               // dollars
  amountInCents: number;
  platformFee: string;          // formatted "1.50"
  sellerPayout: string;         // formatted "13.50"
}

// ─── Request Payloads ────────────────────────────────────────

export interface MakeOfferPayload {
  listingId: string;
  amount: number;               // dollars — between 0.50 and 100,000
  message?: string;
  requirements?: string;
  expectedDelivery?: string;    // ISO date, must be in the future
}

export interface ConfirmOfferPaymentPayload {
  paymentIntentId: string;      // must match /^pi_[a-zA-Z0-9]{24,}$/
  tempOfferId: string;          // must match /^temp_\d+_[a-f0-9]{16}$/
}

export interface CancelTempOfferPayload {
  tempOfferId?: string;
  paymentIntentId?: string;     // at least one required
}

export interface CreateDirectPaymentPayload {
  listingId: string;
  requirements?: string;
}

export interface RejectOfferPayload {
  reason?: string;
}

export interface DeleteAllOffersPayload {
  /** Must equal `DELETE_ALL_OFFERS_YYYY-MM-DD` (today's date) */
  confirmation: string;
}

// ─── Response Shapes ─────────────────────────────────────────

export interface MakeOfferResponse {
  success: true;
  message: string;
  data: {
    tempOfferId: string;
    paymentIntentId: string;
    clientSecret: string;       // Stripe client secret for Elements
    amount: number;
    currency: string;
    expiresIn: number;          // seconds (3600)
    nextSteps: string;
  };
}

export interface ConfirmOfferPaymentResponse {
  success: true;
  message: string;
  data: {
    offerId: string;
    orderId: string;
    amount: number;
    amountInCents: number;
    platformFee: string;
    sellerPayout: string;
    redirectUrl: string;
  };
}

export interface CreateDirectPaymentResponse {
  success: true;
  message: string;
  data: {
    orderId: string;
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    chatId: string;
  };
}

export interface GetOfferResponse {
  success: true;
  data: Offer & {
    associatedOrder: OfferOrder | null;
    chatRoom: OfferChatRoom | null;
  };
  userRole: OfferUserRole;
}

export interface GetOffersResponse {
  success: true;
  data: Offer[];
  count: number;
}

export interface AcceptOfferResponse {
  success: true;
  message: string;
  data: {
    offerId: string;
    orderId?: string;
    status: OfferStatus;
  };
}

export interface RejectOfferResponse {
  success: true;
  message: string;
  data: { offerId: string; status: OfferStatus };
}

export interface CancelOfferResponse {
  success: true;
  message: string;
  data: { offerId: string; status: "cancelled" };
}

export interface OfferStatsResponse {
  success: true;
  data: {
    asBuyer: Partial<Record<OfferStatus, number>>;
    asSeller: Partial<Record<OfferStatus, number>>;
  };
}

export interface HealthCheckResponse {
  success: true;
  status: "healthy";
  timestamp: string;
  services: {
    database: "connected" | "disconnected";
    stripe: "configured";
    firebase: "initialized" | "not_initialized";
    redis: "connected" | "disconnected";
  };
}

export interface GenericOfferResponse {
  success: true;
  message: string;
}