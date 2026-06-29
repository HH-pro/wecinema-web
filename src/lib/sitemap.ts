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

const TIMEOUT_MS = 10_000;
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

export async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  // Ask for one large page; backend may cap, in which case we get what it allows.
  const data = await getJson<unknown>(`/blog?limit=${MAX_PER_TYPE}&page=1`);
  const posts = asArray<BlogLike>(data, "posts", "data");
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

export async function getListingSitemapEntries(): Promise<SitemapEntry[]> {
  const data = await getJson<unknown>(`/marketplace/listings/?limit=${MAX_PER_TYPE}&status=active`);
  const listings = asArray<ListingLike>(data, "listings", "data");
  return listings
    .filter((l) => l._id && (l.status === undefined || l.status === "active"))
    .slice(0, MAX_PER_TYPE)
    .map((l) => ({
      path: `/marketplace/listings/${l._id}`,
      lastModified: l.updatedAt ?? l.createdAt,
    }));
}
