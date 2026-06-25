import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import { serverEnv } from "@/config/env";
import type { Video } from "@/types";

interface VideoListResponse {
  videos?: Video[];
  data?: Video[];
}

const CACHE_TTL = 300; // 5 min

function extractList(data: VideoListResponse | Video[]): Video[] {
  return Array.isArray(data) ? data : data.videos ?? data.data ?? [];
}

/**
 * Fetch videos in a category. Failures degrade to an empty list — the homepage
 * shows a friendly empty state per gallery instead of erroring the whole page.
 */
export async function getVideosByCategory(
  category: string,
  limit = 6,
): Promise<Video[]> {
  try {
    const data = await apiFetch<VideoListResponse | Video[]>(
      `/video/category/${encodeURIComponent(category)}`,
      {
        revalidate: CACHE_TTL,
        tags: [`videos:category:${category.toLowerCase()}`],
      },
    );

    return extractList(data).slice(0, limit);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[videos] category=${category} ${err.status} ${err.statusText}`);
    } else {
      console.error(`[videos] category=${category}`, err);
    }
    return [];
  }
}

export async function getVideosByTheme(theme: string): Promise<Video[]> {
  try {
    const data = await apiFetch<VideoListResponse | Video[]>(
      `/video/themes/${encodeURIComponent(theme)}`,
      { revalidate: CACHE_TTL, tags: [`videos:theme:${theme.toLowerCase()}`] },
    );
    return extractList(data);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[videos] theme=${theme} ${err.status} ${err.statusText}`);
    } else {
      console.error(`[videos] theme=${theme}`, err);
    }
    return [];
  }
}

export async function getVideosByRating(rating: string): Promise<Video[]> {
  try {
    const data = await apiFetch<VideoListResponse | Video[]>(
      `/video/ratings/${encodeURIComponent(rating)}`,
      { revalidate: CACHE_TTL, tags: [`videos:rating:${rating.toLowerCase()}`] },
    );
    return extractList(data);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[videos] rating=${rating} ${err.status} ${err.statusText}`);
    } else {
      console.error(`[videos] rating=${rating}`, err);
    }
    return [];
  }
}

export async function getShortsVideos(limit = 50): Promise<Video[]> {
  try {
    const data = await apiFetch<VideoListResponse | Video[]>(
      `/video/shorts?limit=${limit}`,
      { revalidate: CACHE_TTL, tags: ["videos:shorts"] },
    );
    return extractList(data);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[videos] shorts ${err.status} ${err.statusText}`);
    } else {
      console.error("[videos] shorts", err);
    }
    return [];
  }
}

export async function getHypemodeVideos(): Promise<Video[]> {
  try {
    const data = await apiFetch<VideoListResponse | Video[]>("/video/all", {
      revalidate: CACHE_TTL,
      tags: ["videos:hypemode"],
    });
    const list = Array.isArray(data) ? data : data.videos ?? data.data ?? [];
    return list.filter((v) => v.hasPaid);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[videos] hypemode ${err.status} ${err.statusText}`);
    } else {
      console.error("[videos] hypemode", err);
    }
    return [];
  }
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const url = `${serverEnv.BACKEND_URL}/video/${encodeURIComponent(slug)}`;
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

    // A genuine 404 means the video doesn't exist → caller renders notFound().
    if (res.status === 404) return null;

    // Any OTHER non-OK (429 rate-limit, 5xx, etc.) is a TRANSIENT backend
    // failure, NOT a missing page. Throwing surfaces a real error instead of a
    // misleading "Page not found" for a video that actually exists.
    if (!res.ok) {
      throw new Error(`getVideoBySlug ${slug}: backend responded ${res.status}`);
    }

    const data = await res.json();
    return (data.video ?? data) as Video;
  } finally {
    clearTimeout(timer);
  }
}

export async function getRelatedVideos(
  genres: string | string[],
  excludeId: string,
): Promise<Video[]> {
  const genreList = Array.isArray(genres) ? genres : genres ? [genres] : [];
  if (genreList.length === 0) return [];

  try {
    const results = await Promise.all(
      genreList.map(async (genre) => {
        try {
          const data = await apiFetch<VideoListResponse | Video[]>(
            `/video/category/${encodeURIComponent(genre)}`,
            { revalidate: CACHE_TTL, tags: [`videos:category:${genre.toLowerCase()}`] },
          );
          return Array.isArray(data) ? data : data.videos ?? data.data ?? [];
        } catch {
          return [];
        }
      }),
    );

    const seen = new Set<string>();
    const combined: Video[] = [];
    for (const list of results) {
      for (const v of list) {
        if (v._id !== excludeId && !seen.has(v._id)) {
          seen.add(v._id);
          combined.push(v);
          if (combined.length >= 10) return combined;
        }
      }
    }
    return combined;
  } catch {
    return [];
  }
}
