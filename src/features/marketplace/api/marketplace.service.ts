"use client";

/**
 * Marketplace API Service — Wecinema
 * Base path: /marketplace/listings
 */

import { api } from "@/features/auth/services/apiClient";
import { uploadDirectToS3 } from "@/features/marketplace/api/presignedUpload";
import { toBody } from "@/lib/api/serialize";
import type {
  GetListingsParams,
  GetListingsResponse,
  GetMyListingsParams,
  GetMyListingsResponse,
  GetUserListingsParams,
  GetUserListingsResponse,
  SearchListingsParams,
  SearchListingsResponse,
  CreateListingPayload,
  CreateListingResponse,
  UpdateListingPayload,
  UpdateListingResponse,
  DeleteListingResponse,
  ToggleStatusResponse,
  HealthCheckResponse,
} from "@/types/marketplace.types";

const BASE = "/marketplace/listings";

// ─── Public ──────────────────────────────────────────────────

export function getListings(params?: GetListingsParams): Promise<GetListingsResponse> {
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<GetListingsResponse>(`${BASE}/?${qs}`);
  }
  return api.get<GetListingsResponse>(`${BASE}/`);
}

export function searchListings(params: SearchListingsParams): Promise<SearchListingsResponse> {
  const qs = new URLSearchParams(params as unknown as Record<string, string>).toString();
  return api.get<SearchListingsResponse>(`${BASE}/search?${qs}`);
}

export function getUserListings(
  userId: string,
  params?: GetUserListingsParams
): Promise<GetUserListingsResponse> {
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<GetUserListingsResponse>(`${BASE}/user/${userId}/listings?${qs}`);
  }
  return api.get<GetUserListingsResponse>(`${BASE}/user/${userId}/listings`);
}

export function healthCheck(): Promise<HealthCheckResponse> {
  return api.get<HealthCheckResponse>(`${BASE}/health`);
}

// ─── Protected ───────────────────────────────────────────────

export function getMyListings(params?: GetMyListingsParams): Promise<GetMyListingsResponse> {
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<GetMyListingsResponse>(`${BASE}/my-listings?${qs}`);
  }
  return api.get<GetMyListingsResponse>(`${BASE}/my-listings`);
}

export async function createListing(
  payload: CreateListingPayload,
  onUploadProgress?: (pct: number) => void,
): Promise<CreateListingResponse> {
  const { mediaKeys, thumbnailKey } = await uploadListingFiles(
    payload.mediaFiles ?? [],
    payload.thumbnailFile,
    onUploadProgress,
  );

  return api.post<CreateListingResponse>(`${BASE}/create-listing`, toBody({
    title:       payload.title,
    description: payload.description ?? "",
    price:       payload.price,
    type:        payload.type,
    ...(payload.category    ? { category: payload.category } : {}),
    ...(payload.tags?.length ? { tags: payload.tags }        : {}),
    ...(mediaKeys.length     ? { mediaKeys }                 : {}),
    ...(thumbnailKey         ? { thumbnailKey }              : {}),
  }));
}

async function uploadListingFiles(
  mediaFiles: File[],
  thumbnailFile: File | undefined,
  onProgress?: (pct: number) => void,
): Promise<{ mediaKeys: string[]; thumbnailKey: string | null }> {
  const totals  = [...mediaFiles, ...(thumbnailFile ? [thumbnailFile] : [])].map((f) => f.size);
  const loaded  = totals.map(() => 0);
  const grand   = totals.reduce((a, b) => a + b, 0) || 1;

  const report = () => {
    if (!onProgress) return;
    const sum = loaded.reduce((a, b) => a + b, 0);
    onProgress(Math.min(100, Math.round((sum / grand) * 100)));
  };

  const mediaPromises = mediaFiles.map((file, i) =>
    uploadDirectToS3("listing", file, {
      onProgress: (pct) => { loaded[i] = (totals[i]! * pct) / 100; report(); },
    }).then((a) => a.key),
  );

  const thumbPromise = thumbnailFile
    ? uploadDirectToS3("listing", thumbnailFile, {
        onProgress: (pct) => {
          const idx = totals.length - 1;
          loaded[idx] = (totals[idx]! * pct) / 100;
          report();
        },
      }).then((a) => a.key)
    : Promise.resolve(null);

  const [mediaKeys, thumbnailKey] = await Promise.all([
    Promise.all(mediaPromises),
    thumbPromise,
  ]);

  return { mediaKeys, thumbnailKey };
}

export async function updateListing(
  id: string,
  payload: UpdateListingPayload,
  onUploadProgress?: (pct: number) => void,
): Promise<UpdateListingResponse> {
  const data: Record<string, unknown> = {};
  if (payload.title       !== undefined) data.title       = payload.title;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.price       !== undefined) data.price       = payload.price;
  if (payload.type        !== undefined) data.type        = payload.type;
  if (payload.category    !== undefined) data.category    = payload.category;
  if (payload.tags?.length)              data.tags        = payload.tags;
  if (payload.status      !== undefined) data.status      = payload.status;

  if (payload.mediaFiles?.length || payload.thumbnailFile) {
    const { mediaKeys, thumbnailKey } = await uploadListingFiles(
      payload.mediaFiles ?? [],
      payload.thumbnailFile,
      onUploadProgress,
    );
    if (mediaKeys.length) data.mediaKeys     = mediaKeys;
    if (thumbnailKey)     data.thumbnailKey  = thumbnailKey;
  }

  return api.put<UpdateListingResponse>(`${BASE}/${id}`, data);
}

export function deleteListing(id: string): Promise<DeleteListingResponse> {
  return api.delete<DeleteListingResponse>(`${BASE}/${id}`);
}

export function toggleListingStatus(id: string): Promise<ToggleStatusResponse> {
  return api.patch<ToggleStatusResponse>(`${BASE}/${id}/toggle-status`);
}
