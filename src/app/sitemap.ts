import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";
import { CATEGORIES, THEMES, RATINGS } from "@/lib/constants";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

/**
 * Static + enumerable URLs only. When dynamic routes (videos, listings) come
 * online, fan out additional sitemaps via `app/sitemap.[id]/sitemap.ts`
 * sharded ≤50k URLs each per the sitemap spec.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/marketplace`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
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

  return [...staticPaths, ...categoryPaths, ...themePaths, ...ratingPaths];
}
