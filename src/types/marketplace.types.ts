// ============================================================
// Marketplace Types — Wecinema Frontend
// Mirrors backend marketplace/listingRoutes.js
// Mounted at: /marketplace/listings
// ============================================================

// ─── Primitives ─────────────────────────────────────────────

export type ListingStatus   = "active" | "inactive" | "sold" | "pending";
export type ListingType     = "for_sale" | "licensing" | "adaptation_rights" | "commission" | string;
export type ListingCategory = string;   // free-form on backend
export type SortBy =
  | "price_low"
  | "price_high"
  | "newest"
  | "oldest"
  | "createdAt"
  | "updatedAt";
export type StatusColor = "green" | "blue" | "orange" | "gray";

// ─── Seller (populated) ─────────────────────────────────────

export interface ListingSeller {
  _id: string;
  username: string;
  avatar: string | null;
  sellerRating: number;
  email?: string | null;
}

// ─── Listing ─────────────────────────────────────────────────

/** Full listing shape returned by the backend (formatted) */
export interface Listing {
  _id: string;
  sellerId: ListingSeller | string;
  seller: ListingSeller;
  title: string;
  description: string;
  price: number;
  formattedPrice: string;       // e.g. "$12.99"
  currency: "USD";
  type: ListingType;
  category: string;
  mediaUrls: string[];
  mediaKeys?: string[];
  thumbnail: string | null;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;
  status: ListingStatus;
  statusColor: StatusColor;
  tags: string[];
  sellerEmail?: string | null;
  views: number;
  favoriteCount?: number;
  purchaseCount?: number;
  isDigital: boolean;
  createdAt: string;
  updatedAt: string;
  createdAtFormatted: string;   // e.g. "Jan 15, 2025"
}

// ─── Pagination ─────────────────────────────────────────────

export interface MarketplacePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Request Payloads ────────────────────────────────────────

export interface GetListingsParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  sortOrder?: "asc" | "desc";
  status?: ListingStatus | "active";
}

export interface GetMyListingsParams {
  status?: ListingStatus | "all";
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetUserListingsParams {
  status?: ListingStatus;
  page?: number;
  limit?: number;
}

export interface SearchListingsParams {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  type: ListingType;
  category?: string;
  tags?: string[];
  mediaUrls?: string | string[];
  /** Files to upload directly to S3 via multipart/form-data */
  mediaFiles?: File[];
  /** Optional dedicated thumbnail image */
  thumbnailFile?: File;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  type?: ListingType;
  category?: string;
  tags?: string[];
  mediaUrls?: string[];
  status?: ListingStatus;
  /** New files to replace existing media (uploaded via multipart/form-data) */
  mediaFiles?: File[];
  /** Replace thumbnail image */
  thumbnailFile?: File;
}

// ─── Response Shapes ────────────────────────────────────────

export interface GetListingsResponse {
  success: true;
  listings: Listing[];
  pagination: MarketplacePagination;
  filters: {
    category: string;
    type: string;
    minPrice: string;
    maxPrice: string;
    search: string;
    sortBy: string;
    sortOrder: string;
    status: string;
  };
  currency: "USD";
  timestamp: number;
  message: string;
}

export interface GetMyListingsResponse {
  success: true;
  data: {
    listings: Listing[];
    pagination: MarketplacePagination;
  };
  filters: {
    status: string;
    category: string;
    search: string;
  };
  currency: "USD";
  timestamp: number;
  message: string;
}

export interface GetUserListingsResponse {
  success: true;
  listings: Listing[];
  user: Pick<ListingSeller, "_id" | "username" | "avatar" | "sellerRating">;
  pagination: MarketplacePagination;
}

export interface SearchListingsResponse {
  success: true;
  listings: Listing[];
  pagination: MarketplacePagination;
  search: {
    query: string;
    results: number;
  };
}

export interface CreateListingResponse {
  success: true;
  message: string;
  listing: Pick<
    Listing,
    "_id" | "title" | "price" | "formattedPrice" | "currency" |
    "type" | "category" | "status" | "mediaUrls" | "createdAt"
  > & { seller: Pick<ListingSeller, "_id" | "username"> };
}

export interface UpdateListingResponse {
  success: true;
  message: string;
  listing: Listing;
}

export interface DeleteListingResponse {
  success: true;
  message: string;
  deletedListing: {
    _id: string;
    title: string;
    formattedPrice: string;
  };
}

export interface ToggleStatusResponse {
  success: true;
  message: string;
  listing: Listing;
}

export interface HealthCheckResponse {
  success: true;
  message: string;
  stats: {
    activeListings: number;
    timestamp: string;
  };
}

// ─── Aliases (for index.ts named exports) ────────────────────

/** Single listing response */
export interface GetListingResponse {
  success: true;
  listing: Listing;
}

/** Generic mutation response */
export interface GenericListingResponse {
  success: true;
  message: string;
}