// ============================================================
// Order Types — Wecinema Marketplace
// Mirrors backend marketplace/order.js
// Mounted at: /marketplace/orders
// ============================================================

// ─── Primitives ─────────────────────────────────────────────

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "in_progress"
  | "delivered"
  | "in_revision"
  | "completed"
  | "completed_payment_pending"
  | "completing"        // transient lock state
  | "cancelled"
  | "disputed";

export type CancelledBy      = "buyer" | "seller" | "admin";
export type OrderPaymentStatus = "pending" | "released" | "refunded"; // renamed from PaymentStatus to avoid clash with api.types
export type DeliveryStatus   = "pending_review" | "accepted" | "rejected";

// ─── Populated sub-documents ─────────────────────────────────

export interface OrderUser {
  _id: string;
  username: string;
  avatar: string;
  email: string;
  firstName?: string;
  lastName?: string;
  sellerRating?: number;
  stripeAccountId?: string;
}

export interface OrderListing {
  _id: string;
  title: string;
  mediaUrls: string[];
  price: number;
  category: string;
  type: string;
  description?: string;
  tags?: string[];
  availability?: string;
  deliveryTime?: number;
}

export interface OrderOffer {
  _id: string;
  amount: number;
  message: string;
  requirements?: string;
  expectedDelivery?: string;
  createdAt: string;
}

export interface RevisionNote {
  notes: string;
  requestedAt: string;
  requestedBy: "buyer" | "seller";
}

export interface TimelineEntry {
  status: string;
  date: string;
  description: string;
  icon: string;
}

// ─── Delivery / Attachment ───────────────────────────────────

export interface DeliveryAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  /** S3 object key — required when sending attachments to deliver/revise endpoints */
  key?: string;
  extension?: string;
  uploadedAt?: string;
  deliveryId?: string;
  revisionNumber?: number;
  deliveredAt?: string;
}

export interface Delivery {
  _id: string;
  orderId: string;
  sellerId: OrderUser | string;
  buyerId: OrderUser | string;
  message: string;
  attachments: DeliveryAttachment[];
  isFinalDelivery: boolean;
  revisionNumber: number;
  status: DeliveryStatus;
  createdAt: string;
}

// ─── Order ───────────────────────────────────────────────────

export interface Order {
  _id: string;
  orderNumber?: string;
  offerId: OrderOffer | string;
  listingId: OrderListing | string;
  buyerId: OrderUser | string;
  sellerId: OrderUser | string;
  amount: number;                 // in cents
  platformFee: number;            // in cents
  sellerPayoutAmount: number;     // in cents
  sellerAmount?: number;          // in cents (post-completion)
  currency: string;
  status: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  paymentReleased?: boolean;
  orderType?: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  notes?: string;
  maxRevisions: number;
  revisions: number;
  revisionNotes?: RevisionNote[];
  deliveries?: string[];
  cancelledBy?: CancelledBy;
  cancelReason?: string;
  expectedDelivery: string;
  orderDate: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  processingAt?: string;
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

// ─── Permissions ─────────────────────────────────────────────

export interface OrderPermissions {
  canCompletePayment: boolean;
  canRequestRevision: boolean;
  canCompleteOrder: boolean;
  canCancel: boolean;
  canDownloadFiles: boolean;
  canStartProcessing: boolean;
  canStartWork: boolean;
  canDeliver: boolean;
  canCompleteRevision: boolean;
}

// ─── Stats ───────────────────────────────────────────────────

export interface BuyerOrderStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
  disputed: number;
  totalSpent: number;   // cents
}

export interface SellerOrderStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;       // cents
  pendingRevenue: number;     // cents
}

export interface BuyerStatTotals {
  totalOrders: number;
  totalSpent: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  orders: number;
}

export interface SellerStatTotals {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// ─── Stripe (order-level account check) ──────────────────────

export interface OrderStripeAccountStatus {
  canReceivePayments: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  missingRequirements: string[];
}

// ─── Request Payloads ────────────────────────────────────────

export interface CreateOrderPayload {
  offerId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;         // cents
  shippingAddress?: Order["shippingAddress"];
  paymentMethod?: string;
  notes?: string;
  expectedDeliveryDays?: number;
}

export interface RequestRevisionPayload {
  revisionNotes: string;  // min 10 chars
}

export interface CancelOrderPayload {
  cancelReason?: string;
}

export interface DeliverOrderPayload {
  deliveryMessage: string;
  isFinalDelivery?: boolean;
  files?: File[];         // multipart — handled by FormData
}

export interface AdminUpdateStatusPayload {
  status: OrderStatus;
}

export interface GetCompletedOrdersParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// ─── Response Shapes ─────────────────────────────────────────

export interface CreateOrderResponse {
  success: true;
  message: string;
  order: Order;
  amountDetails: {
    amountInCents: number;
    amountInDollars: string;
    platformFee: string;
    sellerPayout: string;
  };
  nextSteps: {
    paymentRequired: boolean;
    message: string;
    paymentUrl: string;
  };
}

export interface GetMyOrdersResponse {
  success: true;
  orders: Order[];
  stats: BuyerOrderStats;
  count: number;
}

export interface GetMySalesResponse {
  success: true;
  sales: Order[];
  stats: SellerOrderStats;
  count: number;
}

export interface GetOrderDetailResponse {
  success: true;
  order: Order;
  deliveries: Delivery[];
  timeline: TimelineEntry[];
  userRole: "buyer" | "seller" | "admin";
  permissions: OrderPermissions;
  orderSummary: {
    totalAmount: number;
    platformFee: number;
    netAmount: number;
    revisionsUsed: number;
    revisionsLeft: number;
    expectedDelivery: string;
    daysRemaining: number | null;
  };
}

export interface GetTimelineResponse {
  success: true;
  timeline: TimelineEntry[];
  currentStatus: OrderStatus;
  nextSteps: string[];
}

export interface GetDeliveriesResponse {
  success: true;
  deliveries: Delivery[];
  count: number;
  orderStatus: OrderStatus;
  revisionsUsed: number;
  revisionsLeft: number;
  canRequestRevision: boolean;
}

export interface GetDeliveryDetailResponse {
  success: true;
  delivery: Delivery;
  userRole: "buyer" | "seller";
  permissions: {
    canDownloadFiles: boolean;
    canRequestRevision: boolean;
  };
}

export interface GetDownloadFilesResponse {
  success: true;
  files: DeliveryAttachment[];
  count: number;
  canRequestRevision: boolean;
}

export interface OrderSummaryResponse {
  success: true;
  summary: {
    orderInfo: { id: string; orderNumber: string; status: OrderStatus; createdAt: string };
    financial: { totalAmount: number; platformFee: number; netAmount: number; paymentReleased?: boolean; currency: string };
    timeline: {
      revisionsUsed: number;
      revisionsLeft: number;
      deliveriesCount: number;
      expectedDelivery: string;
      timeRemaining: number | null;
      isOverdue: boolean;
      deliveredAt?: string;
      completedAt?: string;
    };
    seller: { username: string; rating: number; name: string | null } | null;
  };
  nextActions: string[];
}

export interface BuyerStatsResponse {
  success: true;
  stats: { _id: OrderStatus; count: number; totalAmount: number }[];
  totals: BuyerStatTotals;
}

export interface SellerStatsResponse {
  success: true;
  data: {
    statsByStatus: { _id: OrderStatus; count: number; totalAmount: number }[];
    completedOrders: Order[];
    totals: SellerStatTotals;
    monthlyRevenue: MonthlyRevenue[];
  };
}

export interface CompletedOrdersResponse {
  success: true;
  data: {
    completedOrders: Order[];
    pagination: { page: number; limit: number; total: number; pages: number };
    summary: { totalOrders: number; totalRevenue: number; averageOrderValue: number };
  };
}

export interface StripeAccountStatusResponse {
  success: true;
  status: OrderStripeAccountStatus;
  setupLink: string | null;
  currency: string;
}

export interface UploadFilesResponse {
  success: true;
  message: string;
  files: DeliveryAttachment[];
  count: number;
}

export interface RevisionResponse {
  success: true;
  message: string;
  revisionsUsed: number;
  revisionsLeft: number;
}

export interface CompleteOrderResponse {
  success: true;
  message: string;
  payment: {
    released: boolean;
    sellerAmount: number;
    platformFee: number;
    totalAmount: number;
    currency: string;
  };
}

export interface DeliverResponse {
  success: true;
  message: string;
  delivery: { id: string; revisionNumber: number };
}

export interface GenericOrderResponse {
  success: true;
  message: string;
  order?: Order;
}

// ─── Aliases (for index.ts named exports) ────────────────────

/** Flat array of timeline entries */
export type OrderTimeline = TimelineEntry[];

/** Alias for RequestRevisionPayload */
export type RevisionPayload = RequestRevisionPayload;

/** Query params for order list endpoints */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

/** Generic paginated orders response */
export interface GetOrdersResponse {
  success: true;
  orders: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}