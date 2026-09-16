export interface Author {
  _id: string;
  username?: string;
  avatar?: string;
  followers?: string[];
  hasPaid?: boolean;
}

export interface VideoComment {
  _id: string;
  text: string;
  createdAt: string;
  userId: { _id: string; username: string; avatar?: string } | string;
  /** Denormalised at write time; the only author info when `userId` isn't populated (e.g. replies, feed payloads). */
  username?: string;
  avatar?: string;
  replies?: VideoComment[];
}

export interface VideoRendition {
  quality: string;
  /**
   * Raw S3 key. The API does NOT return this — responses carry the signed
   * `url` instead — so it is optional and must never be used as a src.
   */
  fileKey?: string;
  bitrate?: number;
  url?: string;
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  /**
   * Signed, playable URL — ABSENT when the video is rented and this viewer
   * holds no active rental. The backend strips it (along with `renditions`)
   * rather than sending a URL the viewer isn't entitled to, so any component
   * that plays video must handle it being undefined. To play a gated video,
   * fetch a short-lived URL from GET /rentals/stream/:videoId.
   */
  file?: string;
  thumbnail?: string;
  thumbnailSmall?: string;
  slug?: string;
  genre: string | string[];
  theme?: string | string[];
  rating?: string;
  /** Creator tags, display form and no '#'. Rendered as #hashtags when single-word. */
  tags?: string[];
  /** Canonical lowercase keys for `tags`, index-aligned with it. Used by /tags/:slug. */
  tagSlugs?: string[];
  author: Author | string;
  views?: number;
  hasPaid?: boolean;
  createdAt: string;
  comments?: VideoComment[];
  likes?: string[];
  dislikes?: string[];
  renditions?: VideoRendition[];
  transcodingStatus?: "pending" | "processing" | "completed" | "failed";
  /** "Listed on the marketplace." NOT a paywall flag — see isRentable. */
  isForSale?: boolean;
  red_carpet?: boolean;
  recommended?: boolean;
  published?: boolean;
  duration?: string | number;
  isShort?: boolean;

  // ── Rentals ────────────────────────────────────────────────
  /** Creator offers this film for paid, time-limited rental. */
  isRentable?: boolean;
  /** Rental price in integer CENTS (e.g. 499 = $4.99). Never dollars. */
  rentalPriceCents?: number;
  rentalCurrency?: string;
  /** Days from purchase in which the viewer must start watching. */
  rentalWindowDays?: number;
  /** Hours the rental stays open once playback first starts. */
  rentalPlayWindowHours?: number;
  /** Set by the server when it withheld `file`/`renditions` from this payload. */
  rentalRequired?: boolean;
}

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  hasPaid: boolean;
  isAdmin: boolean;
  userType?: "buyer" | "seller" | "normalUser";
  subscriptionType?: string | null;
  subscriptionExpiresAt?: string | null;
  trialEndsAt?: string | null;
  /** Temporary test-payment account: paid features unlocked, payments are fake. */
  isTestAccount?: boolean;
}

export interface VideosResponse {
  videos: Video[];
}

export interface Script {
  _id: string;
  title: string;
  genre?: string | string[];
  author?: { username?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

/** { [category]: { [date: YYYY-MM-DD]: count } } */
export type GraphData = Record<string, Record<string, number>>;

export interface GraphDateParams {
  from?: string;
  to?: string;
}

// ─── Profile types ────────────────────────────────────────────

export type ProfileTag = "Actor" | "Studio" | "Filmmaker" | "Writer" | "AI Creator" | "User";
export type UserType = "buyer" | "seller" | "normalUser";
export const MAX_PROFILE_TAGS = 3;

export interface FullUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  dob?: string;
  profileTags: ProfileTag[];
  followers: string[];
  followings: string[];
  isVerified: boolean;
  isAdmin: boolean;
  hasPaid: boolean;
  userType?: UserType;
  allowedGenres?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryEntry {
  _id?: string;
  planId: string;
  planName?: string;
  amount?: number | string;
  currency?: string;
  provider?: string;
  paypalOrderId?: string;
  activatedAt?: string;
  expiresAt?: string;
  userType?: string;
}
