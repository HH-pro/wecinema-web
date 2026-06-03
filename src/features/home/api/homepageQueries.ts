import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import { CATEGORIES } from "@/lib/constants";
import type { Video } from "@/types";

/**
 * Homepage data layer.
 *
 * The homepage used to make 6 separate `/video/category/:genre` calls. We now
 * fetch `/video/all` ONCE (server-side, ISR-cached) and derive everything the
 * page needs in memory: the hero "featured" films, the trending row, per-genre
 * rows (only non-empty genres), and the stat counters. Fewer API calls, and it
 * lets us reliably hide empty genres + compute homepage counts.
 */

interface VideoListResponse {
  videos?: Video[];
  data?: Video[];
  count?: number;
}

const CACHE_TTL = 300; // 5 min — matches page-level `revalidate`

export interface HomepageStats {
  totalFilms: number;
  totalCreators: number;
}

export interface GenreBucket {
  genre: string;
  videos: Video[];
  /** lower-cased slug for the /category/:slug route */
  slug: string;
}

export interface HomepageData {
  featured: Video[];
  trending: Video[];
  byGenre: GenreBucket[];
  stats: HomepageStats;
}

const EMPTY: HomepageData = {
  featured: [],
  trending: [],
  byGenre: [],
  stats: { totalFilms: 0, totalCreators: 0 },
};

function extractList(data: VideoListResponse | Video[]): Video[] {
  return Array.isArray(data) ? data : data.videos ?? data.data ?? [];
}

function authorId(v: Video): string | null {
  if (typeof v.author === "object" && v.author !== null) return v.author._id ?? null;
  if (typeof v.author === "string") return v.author;
  return null;
}

function genresOf(v: Video): string[] {
  if (Array.isArray(v.genre)) return v.genre;
  return v.genre ? [v.genre] : [];
}

/** Content-safety + visibility gate: only published, non-hidden uploads. */
function isPublishable(v: Video): boolean {
  return v.published !== false;
}

/** trending sort: red_carpet first, then most viewed, then newest. */
function trendingSort(a: Video, b: Video): number {
  const rc = Number(b.red_carpet ?? false) - Number(a.red_carpet ?? false);
  if (rc !== 0) return rc;
  const views = (b.views ?? 0) - (a.views ?? 0);
  if (views !== 0) return views;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function getHomepageData(): Promise<HomepageData> {
  let all: Video[];
  try {
    const data = await apiFetch<VideoListResponse | Video[]>("/video/all", {
      revalidate: CACHE_TTL,
      tags: ["videos:all", "videos:home"],
    });
    all = extractList(data).filter(isPublishable);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[home] /video/all ${err.status} ${err.statusText}`);
    } else {
      console.error("[home] /video/all", err);
    }
    return EMPTY;
  }

  if (all.length === 0) return EMPTY;

  // ── Featured (hero): recommended first, fall back to red_carpet + views ──
  const recommended = all.filter((v) => v.recommended).sort(trendingSort);
  const featuredPool =
    recommended.length > 0
      ? recommended
      : all.filter((v) => v.red_carpet).sort(trendingSort);
  const featured = (featuredPool.length > 0 ? featuredPool : [...all].sort(trendingSort)).slice(0, 5);

  // ── Trending: recommended OR red_carpet, sorted, deduped ──
  const trending = all
    .filter((v) => v.recommended || v.red_carpet)
    .sort(trendingSort)
    .slice(0, 12);
  const trendingResolved = trending.length > 0 ? trending : [...all].sort(trendingSort).slice(0, 12);

  // ── Genre rows: only genres that actually contain videos ──
  const byGenre: GenreBucket[] = [];
  for (const genre of CATEGORIES) {
    const lower = genre.toLowerCase();
    const videos = all
      .filter((v) => genresOf(v).some((g) => g.toLowerCase() === lower))
      .sort(trendingSort)
      .slice(0, 12);
    if (videos.length > 0) {
      byGenre.push({ genre, videos, slug: lower });
    }
  }

  // ── Stats ──
  const creators = new Set<string>();
  for (const v of all) {
    const id = authorId(v);
    if (id) creators.add(id);
  }

  return {
    featured,
    trending: trendingResolved,
    byGenre,
    stats: { totalFilms: all.length, totalCreators: creators.size },
  };
}
