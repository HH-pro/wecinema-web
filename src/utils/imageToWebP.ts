"use client";

const WEBP_QUALITY = 0.92;

/**
 * Converts an image File to WebP using the Canvas API.
 * - Already-WebP files are returned unchanged.
 * - Non-image files (video, pdf, etc.) are returned unchanged.
 * - Falls back to the original file if the browser cannot encode WebP.
 */
export async function convertToWebP(file: File): Promise<File> {
  if (file.type === "image/webp" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
