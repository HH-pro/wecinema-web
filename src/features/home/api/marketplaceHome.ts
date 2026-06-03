import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import type { Listing } from "@/types/marketplace.types";

/**
 * Homepage marketplace spotlight data. Public, server-side, ISR-cached.
 * Only `status=active` listings are returned by the backend (admin-approved),
 * which satisfies the "marketplace-approved content only" requirement.
 */

interface ListingsResponse {
  listings?: Listing[];
  pagination?: { total?: number };
}

export interface FeaturedListings {
  listings: Listing[];
  total: number;
}

const CACHE_TTL = 300;
const EMPTY: FeaturedListings = { listings: [], total: 0 };

export async function getFeaturedListings(limit = 8): Promise<FeaturedListings> {
  try {
    const data = await apiFetch<ListingsResponse>(
      `/marketplace/listings/?status=active&sortBy=updatedAt&limit=${limit}`,
      { revalidate: CACHE_TTL, tags: ["marketplace:home"] },
    );
    return {
      listings: data.listings ?? [],
      total: data.pagination?.total ?? data.listings?.length ?? 0,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[home] marketplace ${err.status} ${err.statusText}`);
    } else {
      console.error("[home] marketplace", err);
    }
    return EMPTY;
  }
}
