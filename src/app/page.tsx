import { Suspense } from "react";
import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { ThemePills } from "@/features/videos/components/ThemePills";
import { VideoGallery } from "@/features/videos/components/VideoGallery";
import { ScriptsSection } from "@/features/scripts/components/ScriptsSection";
import { AnalyticsSectionClient } from "@/features/analytics/components/AnalyticsSectionClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";

export const metadata: Metadata = {
  title: "Watch, Create & Sell Films and Scripts Online",
  description:
    "WeCinema is the home of independent film. Watch movies, upload your own, browse scripts, and sell your work to a global audience.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "WeCinema — Watch, Create & Sell Films and Scripts Online",
    description: "WeCinema is the home of independent film. Watch movies, upload your own, browse scripts, and sell your work to a global audience.",
    url: (clientEnv.NEXT_PUBLIC_SITE_URL ?? "https://wecinema.co"),
    images: [{ url: "/seo/WeCinema.webp", width: 1200, height: 630, alt: "WeCinema — Independent Film Platform" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: "WeCinema — Watch, Create & Sell Films and Scripts Online",
    description: "WeCinema is the home of independent film. Watch movies, upload your own, browse scripts, and sell your work to a global audience.",
    images: ["/seo/WeCinema.webp"],
  },
};

export const revalidate = 300;

const GALLERY_SECTIONS = [
  { title: "Action",    category: "Action",    viewAllHref: "/category/action" },
  { title: "Comedy",    category: "Comedy",    viewAllHref: "/category/comedy" },
  { title: "Adventure", category: "Adventure", viewAllHref: "/category/adventure" },
  { title: "Horror",    category: "Horror",    viewAllHref: "/category/horror" },
  { title: "Drama",     category: "Drama",     viewAllHref: "/category/drama" },
  { title: "Love",      category: "Love",      viewAllHref: "/category/love" },
] as const;

function GallerySkeleton() {
  return (
    <div style={{ padding: "24px 24px 32px" }}>
      <div
        style={{
          height: 24,
          width: 120,
          marginBottom: 16,
          borderRadius: 6,
          backgroundColor: "var(--color-skeleton-base)",
        }}
        className="animate-pulse"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "16/9",
              borderRadius: 12,
              backgroundColor: "var(--color-skeleton-base)",
            }}
            className="animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function ScriptsSkeleton() {
  return (
    <div style={{ padding: "24px 24px 32px" }}>
      <div style={{ height: 24, width: 140, marginBottom: 16, borderRadius: 6, backgroundColor: "var(--color-skeleton-base)" }} className="animate-pulse" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 12, backgroundColor: "var(--color-skeleton-base)" }} className="animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

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
        WeCinema — Watch, Create, and Sell Films and Scripts Online
      </h1>

      {/* Analytics graphs — client-only, collapsed by default so LCP is unaffected */}
      <AnalyticsSectionClient title="Analytics" />

      <ThemePills />

      <main id="main-content" aria-labelledby="genres-heading">
        <h2 id="genres-heading" className="sr-only">Browse Films by Genre</h2>

        {GALLERY_SECTIONS.map((section, i) => (
          <Suspense key={section.title} fallback={<GallerySkeleton />}>
            <VideoGallery
              title={section.title}
              category={section.category}
              viewAllHref={section.viewAllHref}
              prioritizeFirst={i === 0}
            />
          </Suspense>
        ))}

        <Suspense fallback={<ScriptsSkeleton />}>
          <ScriptsSection />
        </Suspense>
      </main>
    </Layout>
  );
}
