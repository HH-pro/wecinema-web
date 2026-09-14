// ============================================================
// Deal Types — Wecinema Marketplace
// Mirrors backend src/routes/marketplace/deals.js (base /marketplace/deals)
// ============================================================

export type DealStatus =
  | "pending"
  | "negotiating"
  | "accepted"
  | "paid"
  | "completed"
  | "declined"
  | "cancelled"
  | "expired";

export type DealRole = "buyer" | "seller";

export type ProposalKind = "initial" | "counter" | "revised";

export type DealFilter =
  | "all"
  | "awaiting_response"
  | "negotiating"
  | "accepted"
  | "completed"
  | "declined";

export type DealEvent =
  | "offer"
  | "counter"
  | "revised"
  | "accepted"
  | "declined"
  | "cancelled"
  | "paid"
  | "completed"
  | "expired";

// ─── Sub-docs ────────────────────────────────────────────────

export interface DealTerms {
  amountCents: number;
  currency: "USD";
  dealType: string;
  rights: string;
  territory: string;
  termMonths: number;
  exclusivity: string;
  paymentType: string;
  deliveryMaterials: string;
  notes: string;
}

export interface DealParty {
  _id: string;
  username: string;
  avatar: string | null;
}

export interface DealListing {
  _id: string;
  title: string;
  description: string;
  posterUrl: string | null;
  genre: string | null;
  year: number | null;
  listingType: string;
  listPriceCents: number;
}

export interface DealProposal {
  _id: string;
  kind: ProposalKind;
  terms: DealTerms;
  byUserId: string;
  byRole: DealRole;
  byUsername: string;
  createdAt: string;
}

// ─── Deal ────────────────────────────────────────────────────

export interface Deal {
  _id: string;
  status: DealStatus;
  isOpen: boolean;
  viewerRole: DealRole;
  /** True only while negotiation is open and the other party proposed last. */
  isMyTurn: boolean;
  buyer: DealParty;
  seller: DealParty;
  listing: DealListing;
  terms: DealTerms;
  /** Omitted in list responses. */
  proposals?: DealProposal[];
  proposalCount: number;
  lastProposalBy: string;
  lastProposalRole: DealRole;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string | null;
  orderId: string | null;
  chatId: string | null;
  firebaseChatId: string | null;
  acceptedAt: string | null;
  paidAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  cancelledAt: string | null;
}

export interface DealStats {
  total: number;
  active: number;
  completed: number;
  totalValueCents: number;
}

export type DealCounts = Record<DealFilter, number>;

export interface DealPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Summary attached to /marketplace/chat/my-chats items. */
export interface ChatDealSummary {
  _id: string;
  status: DealStatus;
  amountCents: number;
  dealType: string;
  territory: string;
  termMonths: number;
  title: string;
  posterUrl: string | null;
  isMyTurn: boolean;
  viewerRole: DealRole;
}

/** Metadata on Firestore chat messages with messageType "deal". */
export interface DealChatMessageMeta {
  dealId: string;
  event: DealEvent;
  actorId: string;
  actorName: string;
  actorRole: DealRole;
  amountCents: number;
  dealType: string;
  territory: string;
  termMonths: number;
  dealStatus: DealStatus;
  listingTitle: string;
}

// ─── Payloads ────────────────────────────────────────────────

export interface ListDealsParams {
  status?: DealFilter;
  role?: "all" | DealRole;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateDealPayload {
  listingId: string;
  terms: DealTerms;
}

export interface CounterDealPayload {
  terms: DealTerms;
  expectedProposalCount: number;
}

export interface AcceptDealPayload {
  expectedProposalCount: number;
}

export interface DeclineDealPayload {
  expectedProposalCount: number;
  reason?: string;
}

export interface CancelDealPayload {
  reason?: string;
}

// ─── Responses ───────────────────────────────────────────────

export interface DealResponse {
  success: true;
  data: Deal;
}

export interface ListDealsResponse {
  success: true;
  data: Deal[];
  meta: {
    pagination: DealPagination;
    counts: DealCounts;
    stats: DealStats;
  };
}

export interface DealStatsResponse {
  success: true;
  data: DealStats;
}

export interface DealPaymentIntentResponse {
  success: true;
  /** `testMode`: test-payment accounts get no client secret; confirm the id directly. */
  data: { clientSecret: string | null; paymentIntentId: string; amountCents: number; testMode?: boolean };
}

export interface ConfirmDealPaymentResponse {
  success: true;
  data: { deal: Deal; orderId: string };
}
