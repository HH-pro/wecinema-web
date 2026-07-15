import { NextResponse } from "next/server";
import { getVideoRichEntries } from "@/lib/sitemap";
import { clientEnv } from "@/config/env";

export const revalidate = 3600;

const raw = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE = /localhost/i.test(raw) ? "https://wecinema.co" : raw.replace(/\/$/, "");

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const videos = await getVideoRichEntries().catch(() => []);

  const entries = videos
    .map((v) => {
      const slug = v.slug ?? v._id;
      if (!slug) return "";
      const loc = `${SITE}/watch/${slug}`;
      // Stable proxy (see src/app/og/video/[slug]/route.ts) rather than the raw
      // pre-signed S3 URL, which expires and 403s when Google refetches it.
      const thumbUrl = slug ? esc(`${SITE}/og/video/${slug}`) : "";
      const title = v.title ? esc(v.title) : esc(slug);
      const description = v.description ? esc(v.description.slice(0, 2048)) : "";
      const pubDate = v.createdAt
        ? new Date(v.createdAt).toISOString()
        : new Date().toISOString();
      const rawDuration = v.duration != null ? Number(v.duration) : NaN;
      const durationSec = Number.isFinite(rawDuration) && rawDuration > 0
        ? Math.floor(rawDuration)
        : 0;

      const contentLoc = v.file ? esc(v.file) : "";

      return `  <url>
    <loc>${loc}</loc>
    <video:video>
      <video:thumbnail_loc>${thumbUrl || `${SITE}/seo/Video.webp`}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      ${description ? `<video:description>${description}</video:description>` : ""}
      ${contentLoc ? `<video:content_loc>${contentLoc}</video:content_loc>` : ""}
      <video:publication_date>${pubDate}</video:publication_date>
      ${durationSec ? `<video:duration>${durationSec}</video:duration>` : ""}
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
  </url>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
