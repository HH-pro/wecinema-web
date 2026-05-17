import type { Metadata } from "next";
import { getHypemodeVideos } from "@/features/videos/api/videoQueries";
import { clientEnv } from "@/config/env";
import { HypemodeContent } from "@/app/hypemode/HypemodeContent";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
const TITLE = "HypeMode — Exclusive Premium Films";
const DESCRIPTION =
  "Watch exclusive premium films and videos on WeCinema HypeMode. Access the best content from top creators.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/hypemode" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/hypemode`,
    images: [{ url: `${SITE}/wecinema.webp`, width: 1200, height: 630, alt: "WeCinema HypeMode" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE}/wecinema.webp`],
  },
};

export const revalidate = 300;

export default async function HypemodePage() {
  const videos = await getHypemodeVideos();

  return <HypemodeContent videos={videos} appUrl={clientEnv.NEXT_PUBLIC_APP_URL} />;
}
