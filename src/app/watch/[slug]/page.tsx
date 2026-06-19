import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { getVideoBySlug } from "@/features/videos/api/videoQueries";
import { OG, SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { WatchClient } from "@/features/watch/components/WatchClient";

export const revalidate = 0;

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
  const description = video.description ?? WATCH_FALLBACK_DESCRIPTION;
  const image = video.thumbnail ?? OG.video;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/watch/${slug}` },
    openGraph: {
      type: "video.other",
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
    description: video.description ?? WATCH_FALLBACK_DESCRIPTION,
    thumbnailUrl: [video.thumbnail ?? OG.video],
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
