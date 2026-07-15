import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import type { Video } from "@/types";
import { getVideoBySlug } from "@/features/videos/api/videoQueries";
import { SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { WatchClient } from "@/features/watch/components/WatchClient";

export const revalidate = 3600;

const SITE = SITE_ORIGIN;

/**
 * Convert a duration into an ISO 8601 string (e.g. `PT2M30S`) as required by
 * schema.org VideoObject. Numeric values (or numeric strings) are treated as
 * seconds; an already-formatted `PT…` string is passed through; anything else
 * is dropped so we never emit an invalid duration.
 */
function toISO8601Duration(d: string | number | undefined): string | undefined {
  if (d == null) return undefined;
  if (typeof d === "string" && /^PT/i.test(d)) return d.toUpperCase();
  const totalSeconds = Math.floor(Number(d));
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return undefined;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}

const WATCH_FALLBACK_TITLE = "Watch Independent Films | WeCinema";
const WATCH_FALLBACK_DESCRIPTION =
  "Stream independent films, creator projects, and original stories on WeCinema.";

/** Collapse whitespace and clamp to `max` chars on a word boundary with an ellipsis. */
function clampDescription(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Build a non-empty, useful meta description for a video.
 *
 * Creators frequently leave `description` blank (an empty string, which `??`
 * does NOT treat as missing), so relying on `video.description ?? fallback`
 * shipped an empty `<meta name="description">` on the site's largest URL class.
 * When the real description is missing or too thin, synthesize one from the
 * title, genre and creator instead of falling back to a single generic string.
 */
function buildWatchDescription(video: Video): string {
  const raw = video.description?.trim();
  if (raw && raw.length >= 50) return clampDescription(raw);

  const genres = Array.isArray(video.genre)
    ? video.genre
    : video.genre
      ? [video.genre]
      : [];
  const creator =
    typeof video.author === "string" ? undefined : video.author?.username;
  const genrePart = genres.length
    ? `${genres.slice(0, 2).join(" & ")} film`
    : "independent film";
  const creatorPart = creator ? ` by ${creator}` : "";
  const base = `Watch "${video.title}", ${genrePart}${creatorPart}, streaming now on WeCinema.`;

  return clampDescription(raw ? `${base} ${raw}` : base);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    return {
      title: { absolute: WATCH_FALLBACK_TITLE },
      description: WATCH_FALLBACK_DESCRIPTION,
    };
  }

  const title = `${video.title} | WeCinema`;
  const description = buildWatchDescription(video);
  // Stable, signature-free OG image URL (see src/app/og/video/[slug]/route.ts) —
  // resolves to the current thumbnail server-side so previews never expire.
  const image = `${SITE}/og/video/${slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/watch/${slug}` },
    openGraph: {
      type: "video.movie",
      siteName: "WeCinema",
      title,
      description,
      url: `${SITE}/watch/${slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: video.title }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) notFound();

  const authorName =
    typeof video.author === "string" ? undefined : video.author?.username;
  const duration = toISO8601Duration(video.duration);
  const genres = Array.isArray(video.genre) ? video.genre : video.genre ? [video.genre] : [];

  // schema.org VideoObject — lets Google Video and AI answer engines extract and
  // cite this film directly. Optional fields are omitted (not null) when absent.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: buildWatchDescription(video),
    // Stable proxy URL — a bare signed S3 thumbnail expires and forfeits video
    // rich-result eligibility once Google refetches it.
    thumbnailUrl: [`${SITE}/og/video/${slug}`],
    uploadDate: video.createdAt,
    contentUrl: video.file,
    embedUrl: `${SITE}/watch/${slug}`,
    url: `${SITE}/watch/${slug}`,
    ...(duration ? { duration } : {}),
    ...(genres.length ? { genre: genres } : {}),
    ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
    ...(typeof video.views === "number"
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: { "@type": "WatchAction" },
            userInteractionCount: video.views,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "WeCinema",
      url: SITE,
    },
  };

  return (
    <Layout>
      <JsonLd data={jsonLd} />
      <WatchClient video={video} />
    </Layout>
  );
}
