import { Suspense } from "react";
import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG, SITE_ORIGIN } from "@/lib/seo";
import { getHomepageData } from "@/features/home/api/homepageQueries";
import { getFeaturedListings } from "@/features/home/api/marketplaceHome";
import { getAnalyticsGraphs } from "@/features/home/api/analyticsGraphs";
import { getLatestScripts } from "@/features/scripts/api/scriptsQueries";
import { HeroCarousel } from "@/features/home/components/HeroCarousel";
import { ThemePills } from "@/features/videos";
import { ContinueWatchingRow } from "@/features/home/components/ContinueWatchingRow";
import { TrendingRow } from "@/features/home/components/TrendingRow";
import { GenreRows } from "@/features/home/components/GenreRows";
import { MarketplaceSpotlight } from "@/features/home/components/MarketplaceSpotlight";
import { ForCreators } from "@/features/home/components/ForCreators";
import { FaqSection } from "@/features/home/components/FaqSection";
import { ScriptsSection } from "@/features/scripts/components/ScriptsSection";
import { resolveThumb } from "@/features/home/lib/posterFallback";
import type { HeroFeatured } from "@/features/home/components/hero/PromoSlides";
import type { Video } from "@/types";

const HOME_TITLE = "WeCinema – Buy, Sell & Stream Independent Films";
const HOME_DESCRIPTION =
  "Watch independent films, buy and sell on the marketplace, and upload your own films and scripts to earn on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_ORIGIN,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "WeCinema — Independent Film Platform" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG.default],
  },
};

export const revalidate = 300;

function toHeroFeatured(v: Video): HeroFeatured {
  const genre = Array.isArray(v.genre) ? v.genre[0] : v.genre;
  return {
    id: v._id,
    title: v.title,
    tagline: v.description,
    href: `/watch/${v.slug ?? v._id}`,
    image: resolveThumb(v.thumbnail ?? v.thumbnailSmall),
    redCarpet: Boolean(v.red_carpet),
    genre: genre || undefined,
    rating: v.rating || undefined,
    views: v.views,
  };
}

/** Collect real film thumbnails for the hero collage backdrops. */
function collectPosters(...lists: Video[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const v of list) {
      const thumb = v.thumbnail ?? v.thumbnailSmall;
      if (thumb && !seen.has(thumb)) {
        seen.add(thumb);
        out.push(thumb);
        if (out.length >= 12) return out;
      }
    }
  }
  return out;
}

function RowSkeleton() {
  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div
        style={{ height: 22, width: 160, marginBottom: 16, borderRadius: 6, backgroundColor: "var(--color-skeleton-base)" }}
        className="animate-pulse"
      />
      <div style={{ display: "flex", gap: 16, overflow: "hidden" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{ width: 240, flex: "0 0 auto", aspectRatio: "16/9", borderRadius: 12, backgroundColor: "var(--color-skeleton-base)" }}
            className="animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const SITE = SITE_ORIGIN;

  // Parallel data fetch — one /video/all call powers hero + trending + genres;
  // marketplace and scripts each add one cached call.
  const [home, marketplace, scripts, graphs] = await Promise.all([
    getHomepageData(),
    getFeaturedListings(8),
    getLatestScripts(8),
    getAnalyticsGraphs(),
  ]);

  const heroFeatured = home.featured.map(toHeroFeatured);
  const heroPosters = collectPosters(home.trending, ...home.byGenre.map((b) => b.videos), home.featured);

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "WeCinema",
          url: SITE,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search/{search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "WeCinema",
          url: SITE,
          logo: `${SITE}/wecinema.webp`,
          sameAs: ["https://wecinema.co"],
        }}
      />

      <h1 className="sr-only">
        WeCinema — Watch, Buy, Sell, and Stream Independent Films and Scripts
      </h1>

      {/* Section 1 — Hero carousel (featured film, marketplace, creator, analytics) */}
      <HeroCarousel featured={heroFeatured} graphs={graphs} posters={heroPosters} />

      {/* Browse-by-theme bar, directly under the hero */}
      <ThemePills />

      <main id="main-content">
        {/* Continue watching — auth-only, hides when empty. Stays bare (no
            divider Section) so it never leaves an empty hairline. */}
        <ContinueWatchingRow />

        {/* Content first — discovery before pitch (premium / industry-scale) */}
        <TrendingRow videos={home.trending} />
        <GenreRows buckets={home.byGenre} />

        {/* Commerce you can act on */}
        <MarketplaceSpotlight listings={marketplace.listings} />
        <Suspense fallback={<RowSkeleton />}>
          <ScriptsSection scripts={scripts} />
        </Suspense>

        {/* One merged explain + convert block (Why + How it works + Creator CTA) */}
        <ForCreators />

        {/* FAQ */}
        <FaqSection />
      </main>
    </Layout>
  );
}
