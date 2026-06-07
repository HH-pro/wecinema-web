import { serverEnv } from "@/config/env";

/**
 * Shape of a marketplace listing as needed for SSR metadata + JSON-LD.
 * Mirrors the (richer) client-side `Listing` interface but only the fields the
 * server page reads — keep in sync if structured-data needs grow.
 */
export interface ListingForSeo {
  _id: string;
  title: string;
  description?: string;
  price?: number; // dollars
  currency?: string;
  category?: string;
  status?: string;
  thumbnail?: string;
  mediaUrls?: string[];
  seller?: { _id: string; username?: string };
  sellerId?: { _id: string; username?: string };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch a single listing server-side for metadata/JSON-LD. Mirrors
 * `getVideoBySlug`: a genuine 404 returns null (caller renders notFound);
 * any other non-OK is a transient backend failure and throws, so we never
 * mislabel an existing listing as "not found".
 */
export async function getListingById(id: string): Promise<ListingForSeo | null> {
  const url = `${serverEnv.BACKEND_URL}/marketplace/listings/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // Trusted SSR caller — bypass the backend's IP-keyed rate limiter.
        ...(serverEnv.INTERNAL_API_KEY ? { "x-internal-key": serverEnv.INTERNAL_API_KEY } : {}),
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`getListingById ${id}: backend responded ${res.status}`);
    }

    const data = await res.json();
    const listing = data?.listing ?? data?.data?.listing ?? data?.data ?? data;
    return listing?._id ? (listing as ListingForSeo) : null;
  } finally {
    clearTimeout(timer);
  }
}
