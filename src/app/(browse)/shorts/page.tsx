import type { Metadata } from "next";
import { ShortsCard } from "@/features/videos";
import { getShortsVideos } from "@/features/videos/api/videoQueries";
import { OG, SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Shorts — Quick Independent Films | WeCinema";
const DESCRIPTION = "Watch short-form independent films and clips on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/shorts" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/shorts`,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "Shorts on WeCinema" }],
  },
};

export default async function ShortsPage() {
  const videos = await getShortsVideos(100);

  return (
    <div style={{ padding: "32px 24px" }}>
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
        Shorts
      </h1>
      {videos.length > 0 && (
        <p style={{ margin: "6px 0 24px", fontSize: 14, color: "var(--color-text-tertiary)" }}>
          {videos.length} short{videos.length !== 1 ? "s" : ""}
        </p>
      )}

      {videos.length === 0 ? (
        <p style={{ marginTop: 24, color: "var(--color-text-tertiary)" }}>No shorts yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 20,
            marginTop: 24,
          }}
        >
          {videos.map((v, i) => (
            <ShortsCard key={v._id} video={v} priority={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
