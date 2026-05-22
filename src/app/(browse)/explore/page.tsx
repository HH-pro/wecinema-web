import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { ExploreContent } from "@/app/explore/ExploreContent";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
const TITLE = "Explore Independent Films & Creators | WeCinema";
const DESCRIPTION =
  "Discover indie films, creators, scripts, and rising filmmaking talent on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/explore" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/explore`,
    images: [{ url: OG.explore, width: 1200, height: 630, alt: "WeCinema HypeMode" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.explore],
  },
};

export default function ExplorePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "WeCinema HypeMode",
          description: DESCRIPTION,
          url: `${SITE}/explore`,
          image: OG.explore,
          brand: { "@type": "Brand", name: "WeCinema" },
          offers: [
            { "@type": "Offer", name: "Basic Plan", price: "5.00", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${SITE}/explore` },
            { "@type": "Offer", name: "Pro Plan", price: "10.00", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${SITE}/explore` },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE}/explore`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: `${SITE}/` },
        }}
      />
      <ExploreContent appUrl={clientEnv.NEXT_PUBLIC_APP_URL} />
    </>
  );
}
