import { serverEnv } from "@/config/env";

/**
 * Server-side data fetching for the dynamic sitemap.
 *
 * Talks to BACKEND_URL directly (same pattern as videoQueries.getVideoBySlug)
 * so the sitemap can enumerate every public content URL — videos, blog posts,
 * and marketplace listings — not just the static/enumerable routes.
 *
 * Every fetch degrades to an empty list on any failure: a flaky backend must
 * never 500 the sitemap, or Google drops every URL it already knows about.
 */

// Sitemap generation is an hourly background ISR job, not a user-facing
// request, so it can afford to wait. The blog list endpoint returns ~1.1MB and
// takes ~10s for a full page; at the old 10s ceiling it aborted under build
// concurrency and the sitemap silently shipped with zero blog URLs.
const TIMEOUT_MS = 45_000;
// Single-sitemap spec ceiling is 50k URLs; stay well under with headroom for statics.
const MAX_PER_TYPE = 20_000;

export interface SitemapEntry {
  path: string;            // absolute path beginning with "/"
  lastModified?: string;   // ISO date
}

async function getJson<T>(path: string): Promise<T | null> {
  const url = `${serverEnv.BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      // Refresh hourly — fresh enough for crawlers, cheap enough for the backend.
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function asArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

/**
 * Walk a paginated backend list endpoint until it is exhausted.
 *
 * The backend clamps `limit` server-side (blog to 50, listings to 100) and
 * reports the clamp nowhere in the body, so asking for one huge page silently
 * returned only the first slice — the live sitemap carried 50 of 66 blog posts.
 * Paging off the response's own `pages`/`total` is the only safe read.
 */
async function fetchAllPages<T>(
  buildPath: (page: number) => string,
  keys: string[],
  pageSize: number,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  // Hard ceiling so a backend reporting a bad `pages` value can't spin forever.
  const maxPages = Math.ceil(MAX_PER_TYPE / pageSize) + 1;

  while (page <= maxPages && out.length < MAX_PER_TYPE) {
    const data = await getJson<unknown>(buildPath(page));
    if (!data) break;

    const batch = asArray<T>(data, ...keys);
    if (batch.length === 0) break;
    out.push(...batch);

    const meta = (data ?? {}) as {
      pages?: number;
      pagination?: { pages?: number };
    };
    const totalPages = meta.pages ?? meta.pagination?.pages;
    if (totalPages !== undefined && page >= totalPages) break;
    if (batch.length < pageSize) break;

    page += 1;
  }

  return out.slice(0, MAX_PER_TYPE);
}

export interface VideoLike {
  _id?: string;
  slug?: string;
  updatedAt?: string;
  createdAt?: string;
  hidden?: boolean;
  published?: boolean;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number | string;
  file?: string;
}

export async function getVideoSitemapEntries(): Promise<SitemapEntry[]> {
  const data = await getJson<unknown>("/video/all");
  const videos = asArray<VideoLike>(data, "videos", "data");
  return videos
    .filter((v) => (v.slug || v._id) && v.hidden !== true && v.published !== false)
    .slice(0, MAX_PER_TYPE)
    .map((v) => ({
      path: `/watch/${v.slug ?? v._id}`,
      lastModified: v.updatedAt ?? v.createdAt,
    }));
}

export async function getVideoRichEntries(): Promise<VideoLike[]> {
  const data = await getJson<unknown>("/video/all");
  const videos = asArray<VideoLike>(data, "videos", "data");
  return videos
    .filter((v) => (v.slug || v._id) && v.hidden !== true && v.published !== false)
    .slice(0, MAX_PER_TYPE);
}

interface BlogLike {
  slug?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
}

/**
 * Backend clamps `limit` to 50 (routes/blog.js), but a 50-post page is ~1.1MB
 * and ~10s. Smaller pages keep each request comfortably inside the timeout.
 */
const BLOG_PAGE_SIZE = 25;

export async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  const posts = await fetchAllPages<BlogLike>(
    (page) => `/blog?limit=${BLOG_PAGE_SIZE}&page=${page}`,
    ["posts", "data"],
    BLOG_PAGE_SIZE,
  );
  return posts
    .filter((p) => p.slug)
    .slice(0, MAX_PER_TYPE)
    .map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? p.createdAt,
    }));
}

interface ListingLike {
  _id?: string;
  slug?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

/** Backend clamps `limit` to 100 here (listingController.js). Page at that size. */
const LISTING_PAGE_SIZE = 100;

export async function getListingSitemapEntries(): Promise<SitemapEntry[]> {
  const listings = await fetchAllPages<ListingLike>(
    (page) =>
      `/marketplace/listings/?limit=${LISTING_PAGE_SIZE}&page=${page}&status=active`,
    ["listings", "data"],
    LISTING_PAGE_SIZE,
  );
  return listings
    .filter((l) => l._id && (l.status === undefined || l.status === "active"))
    .slice(0, MAX_PER_TYPE)
    .map((l) => ({
      path: `/marketplace/listings/${l._id}`,
      lastModified: l.updatedAt ?? l.createdAt,
    }));
}
