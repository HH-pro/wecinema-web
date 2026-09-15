import { api } from "@/features/auth/services/apiClient";

/**
 * Client for /video-drafts — resumable uploads saved as drafts.
 * See wecinema-backend/src/services/videoDraft.service.js.
 */

export type DraftUploadState = "uploading" | "uploaded" | "failed";

export interface VideoDraft {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  theme: string[];
  rating: string;
  thumbnail: string | null;
  thumbnailKey: string | null;
  /** Signed playable URL — only once the upload has finished. */
  file: string | null;
  duration: number | null;
  isShort: boolean;
  hasPaid: boolean;
  isForSale: boolean;
  isRentable: boolean;
  rentalPriceCents: number | null;
  upload: {
    state: DraftUploadState;
    fileName: string | null;
    fileSize: number | null;
    contentType: string | null;
    partSize: number;
    totalParts: number;
    startedAt: string | null;
    completedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DraftChanges {
  title?: string;
  description?: string;
  genre?: string[];
  theme?: string[];
  rating?: string;
  thumbnailKey?: string;
  duration?: number;
  isShort?: boolean;
  hasPaid?: boolean;
  isForSale?: boolean;
  isRentable?: boolean;
  rentalPriceCents?: number;
}

export interface PartsListing {
  state: DraftUploadState;
  totalParts: number;
  parts: { partNumber: number; size: number }[];
}

export interface PublishResult {
  videoId: string;
  slug: string | null;
  transcodingStatus: "processing" | null;
  isRentable: boolean;
  rentalPriceCents: number | null;
  rentalWarning?: { code?: string; message?: string };
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

const unwrap = <T>(p: Promise<Envelope<T>>) => p.then((r) => r.data);

export function createDraft(body: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  duration?: number;
}): Promise<VideoDraft> {
  return unwrap(api.post<Envelope<VideoDraft>>("/video-drafts", body as unknown as Record<string, unknown>));
}

export function listDrafts(): Promise<VideoDraft[]> {
  return unwrap(api.get<Envelope<VideoDraft[]>>("/video-drafts"));
}

export function getDraft(id: string): Promise<VideoDraft> {
  return unwrap(api.get<Envelope<VideoDraft>>(`/video-drafts/${id}`));
}

export function updateDraft(id: string, changes: DraftChanges): Promise<VideoDraft> {
  return unwrap(api.patch<Envelope<VideoDraft>>(`/video-drafts/${id}`, changes as Record<string, unknown>));
}

export function deleteDraft(id: string): Promise<void> {
  return unwrap(api.delete<Envelope<unknown>>(`/video-drafts/${id}`)).then(() => undefined);
}

export function listParts(id: string): Promise<PartsListing> {
  return unwrap(api.get<Envelope<PartsListing>>(`/video-drafts/${id}/parts`));
}

export function signParts(id: string, partNumbers: number[]): Promise<{ urls: Record<string, string> }> {
  return unwrap(api.post<Envelope<{ urls: Record<string, string> }>>(`/video-drafts/${id}/parts/sign`, { partNumbers }));
}

export function completeUpload(id: string): Promise<VideoDraft> {
  return unwrap(api.post<Envelope<VideoDraft>>(`/video-drafts/${id}/complete`));
}

export function publishDraft(id: string): Promise<PublishResult> {
  return unwrap(api.post<Envelope<PublishResult>>(`/video-drafts/${id}/publish`));
}
