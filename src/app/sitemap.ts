import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";
import { CATEGORIES, THEMES, RATINGS } from "@/lib/constants";
import {
  getVideoSitemapEntries,
  getBlogSitemapEntries,
  getListingSitemapEntries,
  type SitemapEntry,
} from "@/lib/sitemap";

// Never emit localhost URLs into the sitemap — they are rejected by Google Search Console.
// Falls back to the canonical production URL if the env var is missing or local.
const raw = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE = /localhost/i.test(raw) ? "https://wecinema.co" : raw.replace(/\/$/, "");

// Re-generate hourly so newly published videos/posts/listings get crawled promptly.
export const revalidate = 3600;

function toEntry(
  e: SitemapEntry,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  fallback: Date,
): MetadataRoute.Sitemap[number] {
  const lm = e.lastModified ? new Date(e.lastModified) : fallback;
  return {
    url: `${SITE}${e.path}`,
    lastModified: Number.isNaN(lm.getTime()) ? fallback : lm,
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/marketplace`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/marketplace/browse`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/hypemode`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/scripts`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/marketplace/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/marketplace/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms-and-conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPaths: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE}/category/${c.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const themePaths: MetadataRoute.Sitemap = THEMES.map((t) => ({
    url: `${SITE}/themes/${t.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const ratingPaths: MetadataRoute.Sitemap = RATINGS.map((r) => ({
    url: `${SITE}/ratings/${r}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Dynamic content — fetched concurrently; any failure degrades to [] so the
  // sitemap always builds (Promise.allSettled never rejects the whole route).
  const [videos, posts, listings] = await Promise.allSettled([
    getVideoSitemapEntries(),
    getBlogSitemapEntries(),
    getListingSitemapEntries(),
  ]);

  const videoPaths =
    videos.status === "fulfilled"
      ? videos.value.map((e) => toEntry(e, "weekly", 0.8, now))
      : [];
  const blogPaths =
    posts.status === "fulfilled"
      ? posts.value.map((e) => toEntry(e, "monthly", 0.6, now))
      : [];
  const listingPaths =
    listings.status === "fulfilled"
      ? listings.value.map((e) => toEntry(e, "daily", 0.7, now))
      : [];

  return [
    ...staticPaths,
    ...categoryPaths,
    ...themePaths,
    ...ratingPaths,
    ...videoPaths,
    ...blogPaths,
    ...listingPaths,
  ];
}
