import type { Metadata } from "next";
import { getShortsVideos } from "@/features/videos/api/videoQueries";
import { ShortsPlayer } from "@/features/videos/components/ShortsPlayer";
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
  return <ShortsPlayer videos={videos} />;
}
