"use client";

/**
 * Pre-signed S3 Upload Helper
 *
 * YouTube-style upload flow: the browser uploads files DIRECTLY to S3 via a
 * short-lived pre-signed PUT URL issued by our backend. The Node server is
 * never in the file's path — minimum memory, no bandwidth proxying.
 *
 * Flow:
 *   1) POST /uploads/presign  →  { uploadUrl, key, publicUrl }
 *   2) PUT  uploadUrl (file)  →  S3 stores the object
 *   3) Caller passes `key` to whatever create/update endpoint needs it
 *      (e.g. POST /video/create with { fileKey, thumbnailKey, ... })
 */

import { api } from "@/features/auth/services/apiClient";
import { convertToWebP } from "@/utils/imageToWebP";

export type PresignKind =
  | "video"
  | "thumbnail"
  | "avatar"
  | "cover"
  | "blog"
  | "delivery"
  | "listing";

export interface PresignResponse {
  uploadUrl: string;          // pre-signed PUT URL (expires in ~15 min)
  key: string;                // S3 object key — store this in DB
  publicUrl: string;          // CloudFront / S3 URL (sign on read for private buckets)
  expiresIn: number;          // seconds
  requiredHeaders: Record<string, string>;
}

export interface PresignParams {
  kind: PresignKind;
  contentType: string;
  filename?: string;
  postTitle?: string;         // only used for kind="blog"
  sizeBytes?: number;         // optional client-side size check
}

/** Step 1: ask backend for a pre-signed URL */
export async function getPresignedUrl(params: PresignParams): Promise<PresignResponse> {
  return api.post<PresignResponse>("/uploads/presign", params as unknown as Record<string, unknown>);
}

/** Step 2: PUT the file directly to S3. Reports 0–100 progress.
 *  `requiredHeaders` must include every header the server signed (currently
 *  Content-Type + Cache-Control). Sending a different set will fail the
 *  signature check at S3. */
export function putToS3(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
  requiredHeaders?: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    const headers = requiredHeaders ?? { "Content-Type": contentType };
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during S3 upload"));
    xhr.onabort = () => reject(new Error("Upload was cancelled"));
    xhr.send(file);
  });
}

export interface UploadedAsset {
  key: string;
  publicUrl: string;
  contentType: string;
  size: number;
  originalName: string;
}

/**
 * Convenience: presign + PUT in one call.
 * Returns the S3 key (and metadata) — pass to your create/update endpoint.
 */
export async function uploadDirectToS3(
  kind: PresignKind,
  file: File | Blob,
  opts: {
    filename?: string;        // required if `file` is a Blob
    contentType?: string;     // overrides file.type
    postTitle?: string;       // for kind="blog"
    onProgress?: (pct: number) => void;
  } = {},
): Promise<UploadedAsset> {
  // Convert images to WebP before upload (skip for video/delivery blobs and explicit overrides)
  if (file instanceof File && !opts.contentType) {
    file = await convertToWebP(file);
  }

  const isFile = (file as File).name !== undefined;
  const contentType =
    opts.contentType ||
    (isFile ? (file as File).type : "application/octet-stream") ||
    "application/octet-stream";
  const originalName =
    opts.filename ||
    (isFile ? (file as File).name : `upload.${contentType.split("/")[1] || "bin"}`);

  const presign = await getPresignedUrl({
    kind,
    contentType,
    filename:  originalName,
    postTitle: opts.postTitle,
    sizeBytes: file.size,
  });

  await putToS3(
    presign.uploadUrl,
    file,
    contentType,
    opts.onProgress,
    presign.requiredHeaders,
  );

  return {
    key:          presign.key,
    publicUrl:    presign.publicUrl,
    contentType,
    size:         file.size,
    originalName,
  };
}

/**
 * Upload many files in parallel. Aggregates progress across all files.
 */
export async function uploadManyDirectToS3(
  kind: PresignKind,
  files: File[],
  opts: {
    onProgress?: (pct: number) => void;
    postTitle?: string;
  } = {},
): Promise<UploadedAsset[]> {
  if (files.length === 0) return [];

  const totals  = files.map((f) => f.size);
  const loaded  = files.map(() => 0);
  const grand   = totals.reduce((a, b) => a + b, 0) || 1;

  const reportTotal = () => {
    if (!opts.onProgress) return;
    const sumLoaded = loaded.reduce((a, b) => a + b, 0);
    opts.onProgress(Math.min(100, Math.round((sumLoaded / grand) * 100)));
  };

  return Promise.all(
    files.map((file, idx) =>
      uploadDirectToS3(kind, file, {
        postTitle: opts.postTitle,
        onProgress: (pct) => {
          loaded[idx] = (totals[idx]! * pct) / 100;
          reportTotal();
        },
      }),
    ),
  );
}
