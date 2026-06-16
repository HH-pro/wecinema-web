import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Marketplace Resources | WeCinema";
const DESCRIPTION =
  "Guides, tools, and resources for filmmakers and buyers using the WeCinema marketplace.";

// Client-component page — metadata lives here so the route is indexable with a
// self-referencing canonical instead of inheriting the homepage canonical.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/marketplace/resources" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/marketplace/resources`,
    images: [{ url: OG.marketplaceResources, width: 1200, height: 630, alt: "WeCinema Marketplace Resources" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.marketplaceResources],
  },
};

export default function MarketplaceResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
