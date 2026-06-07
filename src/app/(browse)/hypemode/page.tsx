import type { Metadata } from "next";
import { getHypemodeVideos } from "@/features/videos/api/videoQueries";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { HypemodeContent } from "@/app/hypemode/HypemodeContent";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
const TITLE = "Hype Mode – Creator Discovery Feed | WeCinema";
const DESCRIPTION =
  "Get discovered through WeCinema Hype Mode and connect your films with audiences and industry professionals.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/hypemode" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/hypemode`,
    images: [{ url: OG.explore, width: 1200, height: 630, alt: "WeCinema HypeMode" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.explore],
  },
};

export const revalidate = 300;

export default async function HypemodePage() {
  const videos = await getHypemodeVideos();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "WeCinema Hype Mode",
          serviceType: "Film & creator discovery",
          description: DESCRIPTION,
          url: `${SITE}/hypemode`,
          provider: { "@type": "Organization", name: "WeCinema", url: SITE },
          areaServed: "Worldwide",
          audience: { "@type": "Audience", audienceType: "Filmmakers and content creators" },
        }}
      />
      <h1 className="sr-only">WeCinema Hype Mode — Get Your Films Discovered</h1>
      <HypemodeContent videos={videos} appUrl={clientEnv.NEXT_PUBLIC_APP_URL} />
    </>
  );
}
