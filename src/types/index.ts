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
  replies?: VideoComment[];
}

export interface VideoRendition {
  quality: string;
  fileKey: string;
  bitrate?: number;
  url?: string;
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  file: string;
  thumbnail?: string;
  thumbnailSmall?: string;
  slug?: string;
  genre: string | string[];
  theme?: string | string[];
  rating?: string;
  author: Author | string;
  views?: number;
  hasPaid?: boolean;
  createdAt: string;
  comments?: VideoComment[];
  likes?: string[];
  dislikes?: string[];
  renditions?: VideoRendition[];
  transcodingStatus?: "pending" | "processing" | "completed" | "failed";
  isForSale?: boolean;
  red_carpet?: boolean;
  recommended?: boolean;
  published?: boolean;
  duration?: string | number;
  isShort?: boolean;
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
