import { api } from "@/features/auth/services/apiClient";
import type { FullUser, SubscriptionHistoryEntry, UserType } from "@/types";

// ─── Local interfaces ─────────────────────────────────────────

export interface ProfileVideo {
  _id: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  thumbnailSmall?: string;
  slug?: string;
  genre?: string;
  views?: number;
  createdAt?: string;
  duration?: string;
}

export interface ProfileScript {
  _id: string;
  title?: string;
  script?: string;
  genre?: string | string[];
  createdAt?: string;
}

export interface BookmarkedVideo {
  _id: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  thumbnailSmall?: string;
  slug?: string;
  genre?: string | string[];
  rating?: string;
  views?: number;
  createdAt?: string;
  author?: { _id: string; username?: string; avatar?: string } | string;
}

export interface BookmarkedScript {
  _id: string;
  title?: string;
  genre?: string | string[];
  description?: string;
  createdAt?: string;
  author?: { _id: string; username?: string; avatar?: string } | string;
}

export interface HistoryEntry {
  _id: string;
  videoId: BookmarkedVideo;
  watchedAt: string;
}

export interface Channel {
  _id: string;
  username: string;
  avatar?: string | null;
  bio?: string;
  profileTags?: string[];
  isVerified?: boolean;
  userType?: string | null;
  followersCount?: number;
}

interface ChannelSearchResponse {
  channels?: Channel[];
  total?: number;
  hasMore?: boolean;
}

// ─── User ─────────────────────────────────────────────────────

export function getUserById(id: string): Promise<FullUser> {
  return api.get<FullUser>(`/user/${id}`);
}

/** Search channels (users) by name for the YouTube-style channel search. */
export function searchChannels(
  query: string,
  opts: { page?: number; limit?: number } = {},
): Promise<ChannelSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  return api.get<ChannelSearchResponse>(`/user/search?${params.toString()}`);
}

export function getPaymentStatus(id: string): Promise<{ hasPaid: boolean }> {
  return api.get<{ hasPaid: boolean }>(`/user/payment-status/${id}`);
}

export function editProfile(
  id: string,
  payload: Record<string, unknown>,
): Promise<{ user: FullUser }> {
  return api.put<{ user: FullUser }>(`/user/edit/${id}`, payload);
}

export function changeUserType(id: string, userType: UserType): Promise<void> {
  return api.put<void>(`/user/change-type/${id}`, { userType });
}

export function checkUsernameAvailable(
  username: string,
  excludeId?: string,
): Promise<{ available: boolean; reason?: string }> {
  const params = new URLSearchParams({ username });
  if (excludeId) params.set("excludeId", excludeId);
  return api.get<{ available: boolean; reason?: string }>(
    `/user/check-username?${params.toString()}`,
  );
}

// ─── Videos ──────────────────────────────────────────────────

export function getVideosByAuthor(authorId: string): Promise<ProfileVideo[]> {
  return api
    .get<{ videos?: ProfileVideo[]; data?: ProfileVideo[] } | ProfileVideo[]>(
      `/video/authors/${authorId}/videos`,
    )
    .then((res) => {
      if (Array.isArray(res)) return res;
      return res.videos ?? res.data ?? [];
    });
}

export function getLikedVideos(userId: string): Promise<BookmarkedVideo[]> {
  return api
    .get<{ videos?: BookmarkedVideo[] } | BookmarkedVideo[]>(
      `/video/liked/${userId}`,
    )
    .then((res) => {
      if (Array.isArray(res)) return res;
      return res.videos ?? [];
    });
}

export function getWatchHistory(userId: string): Promise<HistoryEntry[]> {
  return api
    .get<{ history?: HistoryEntry[] } | HistoryEntry[]>(
      `/video/history/${userId}`,
    )
    .then((res) => {
      if (Array.isArray(res)) return res;
      return res.history ?? [];
    });
}

export function deleteVideo(id: string): Promise<void> {
  return api.delete<void>(`/video/delete/${id}`);
}

export function editVideo(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  return api.put<void>(`/video/edit/${id}`, payload);
}

// ─── Scripts ─────────────────────────────────────────────────

export function getScriptsByAuthor(authorId: string): Promise<ProfileScript[]> {
  return api
    .get<{ scripts?: ProfileScript[] } | ProfileScript[]>(
      `/video/authors/${authorId}/scripts`,
    )
    .then((res) => {
      if (Array.isArray(res)) return res;
      return res.scripts ?? [];
    });
}

export function deleteScript(id: string): Promise<void> {
  return api.delete<void>(`/video/scripts/${id}`);
}

// ─── Bookmarks ───────────────────────────────────────────────

export function getVideoBookmarks(
  userId: string,
): Promise<{ bookmarks: BookmarkedVideo[] }> {
  return api.get<{ bookmarks: BookmarkedVideo[] }>(`/video/bookmarks/${userId}`);
}

export function addVideoBookmark(videoId: string): Promise<void> {
  return api.post<void>(`/video/${videoId}/bookmark`);
}

export function removeVideoBookmark(videoId: string): Promise<void> {
  return api.delete<void>(`/video/${videoId}/bookmark`);
}

export function getScriptBookmarks(
  userId: string,
): Promise<{ bookmarks: BookmarkedScript[] }> {
  return api.get<{ bookmarks: BookmarkedScript[] }>(
    `/video/scripts/bookmarks/${userId}`,
  );
}

export function addScriptBookmark(scriptId: string): Promise<void> {
  return api.post<void>(`/video/scripts/${scriptId}/bookmark`);
}

export function removeScriptBookmark(scriptId: string): Promise<void> {
  return api.delete<void>(`/video/scripts/${scriptId}/bookmark`);
}

// ─── Subscriptions ────────────────────────────────────────────

export function getSubscriptionHistory(
  userId: string,
): Promise<{ history: SubscriptionHistoryEntry[] }> {
  return api.get<{ history: SubscriptionHistoryEntry[] }>(
    `/payments/history/${userId}`,
  );
}
