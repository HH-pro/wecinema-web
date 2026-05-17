import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getVideosByRating } from "@/features/videos/api/videoQueries";
import { RATINGS, RATING_META } from "@/lib/constants";
import { clientEnv } from "@/config/env";

export const revalidate = 300;

type Params = { rating: string };

export function generateStaticParams(): Params[] {
  return RATINGS.map((r) => ({ rating: r }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { rating } = await params;
  const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
  const meta = RATING_META[rating];
  const label = meta?.label ?? rating;

  return {
    title: `Rated ${rating} Films`,
    description: `Watch ${rating}-rated films (${label}) on WeCinema. Discover independent cinema with ${rating} content rating from filmmakers worldwide.`,
    alternates: { canonical: `/ratings/${rating}` },
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title: `Rated ${rating} Films | WeCinema`,
      description: `Watch ${rating}-rated independent films on WeCinema.`,
      url: `${SITE}/ratings/${rating}`,
      images: [{ url: `${SITE}/wecinema.webp`, width: 1200, height: 630, alt: `Rated ${rating} films` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Rated ${rating} Films | WeCinema`,
      description: `Watch ${rating}-rated independent films on WeCinema.`,
      images: [`${SITE}/wecinema.webp`],
    },
  };
}

export default async function RatingPage({ params }: { params: Promise<Params> }) {
  const { rating } = await params;

  const isKnown = (RATINGS as readonly string[]).includes(rating);
  if (!isKnown) notFound();

  const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
  const meta = RATING_META[rating];
  const videos = await getVideosByRating(rating);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Rated ${rating} Films`,
          description: `${rating}-rated independent films on WeCinema.`,
          url: `${SITE}/ratings/${rating}`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: SITE },
        }}
      />

      <div style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              flexShrink: 0,
              width: 56,
              height: 56,
              borderRadius: 12,
              border: `2px solid ${meta?.color ?? "var(--color-border-primary)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: rating.length > 2 ? 14 : 18,
              fontFamily: "var(--font-poppins)",
              color: meta?.color ?? "var(--color-text-primary)",
            }}
          >
            {rating}
          </div>
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-tertiary)",
              }}
            >
              Content Rating
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 800,
                fontFamily: "var(--font-poppins)",
                color: "var(--color-text-primary)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Rated {rating}
              {meta && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 10,
                    fontSize: "0.45em",
                    fontWeight: 500,
                    color: "var(--color-text-tertiary)",
                    verticalAlign: "middle",
                  }}
                >
                  — {meta.label}
                </span>
              )}
            </h1>
            {videos.length > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
                {videos.length} film{videos.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <VideoGrid videos={videos} emptyMessage={`No ${rating}-rated films yet.`} />
      </div>
    </>
  );
}
