import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getVideosByCategory } from "@/features/videos/api/videoQueries";
import { CATEGORIES } from "@/lib/constants";
import { clientEnv } from "@/config/env";

export const revalidate = 300;

type Params = { genre: string };

export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ genre: c.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

  return {
    title: `${label} Films`,
    description: `Watch the best independent ${label.toLowerCase()} films on WeCinema. Stream, discover, and support filmmakers worldwide.`,
    alternates: { canonical: `/category/${genre}` },
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title: `${label} Films | WeCinema`,
      description: `Stream independent ${label.toLowerCase()} films on WeCinema.`,
      url: `${SITE}/category/${genre}`,
      images: [{ url: `${SITE}/seo/WeCinema.webp`, width: 1200, height: 630, alt: `${label} films on WeCinema` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} Films | WeCinema`,
      description: `Stream independent ${label.toLowerCase()} films on WeCinema.`,
      images: [`${SITE}/seo/WeCinema.webp`],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { genre } = await params;

  if (!genre || genre.length > 60 || !/^[a-z0-9-]+$/i.test(genre)) notFound();

  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
  const videos = await getVideosByCategory(label, 100);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${label} Films`,
          description: `Stream independent ${label.toLowerCase()} films on WeCinema.`,
          url: `${SITE}/category/${genre}`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: SITE },
        }}
      />

      <div style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-accent-primary)",
            }}
          >
            Genre
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              fontFamily: "var(--font-poppins)",
              color: "var(--color-text-primary)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {label}
          </h1>
          {videos.length > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
              {videos.length} film{videos.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <VideoGrid videos={videos} emptyMessage={`No ${label.toLowerCase()} films yet.`} />
      </div>
    </>
  );
}
