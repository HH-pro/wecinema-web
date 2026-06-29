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
      const thumbUrl = v.thumbnail ? esc(v.thumbnail) : "";
      const title = v.title ? esc(v.title) : esc(slug);
      const description = v.description ? esc(v.description.slice(0, 2048)) : "";
      const pubDate = v.createdAt
        ? new Date(v.createdAt).toISOString()
        : new Date().toISOString();

      return `  <url>
    <loc>${loc}</loc>
    <video:video>
      <video:thumbnail_loc>${thumbUrl || `${SITE}/seo/Video.webp`}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      ${description ? `<video:description>${description}</video:description>` : ""}
      <video:content_loc>${loc}</video:content_loc>
      <video:player_loc>${loc}</video:player_loc>
      <video:publication_date>${pubDate}</video:publication_date>
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
