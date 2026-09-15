"use client";

import { api } from "@/features/auth/services/apiClient";
import { convertToWebP } from "@/utils/imageToWebP";

export type PresignKind = "avatar" | "cover" | "thumbnail" | "video" | "blog" | "listing";

interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  requiredHeaders?: Record<string, string>;
}

export async function uploadDirectToS3(
  kind: PresignKind,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ key: string; publicUrl: string }> {
  // Convert images to WebP before upload
  file = await convertToWebP(file);

  // Through the API client so an expired access token is refreshed (single-flight)
  // instead of failing the upload with "session expired".
  const { uploadUrl, key, publicUrl, requiredHeaders = {} } = await api.post<PresignResponse>(
    "/uploads/presign",
    {
      kind,
      contentType: file.type,
      filename: file.name,
      sizeBytes: file.size,
    },
  );

  // Step 2: PUT directly to S3 (no auth header — S3 rejects it)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);

    // Apply any required headers returned by the presign endpoint
    Object.entries(requiredHeaders).forEach(([h, v]) => xhr.setRequestHeader(h, v));

    if (!requiredHeaders["Content-Type"]) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("S3 upload network error"));
    xhr.ontimeout = () => reject(new Error("S3 upload timed out"));

    xhr.send(file);
  });

  return { key, publicUrl };
}
