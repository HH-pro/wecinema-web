import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Browse the Film Marketplace | WeCinema";
const DESCRIPTION =
  "Browse films, scripts, licensing and adaptation rights for sale from independent creators on the WeCinema marketplace.";

// The page is a client component and can't export metadata itself, so this
// sibling layout supplies the title + self-referencing canonical for indexing.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/marketplace/browse" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/marketplace/browse`,
    images: [{ url: OG.marketplaceBrowse, width: 1200, height: 630, alt: "Browse the WeCinema Marketplace" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.marketplaceBrowse],
  },
};

export default function MarketplaceBrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
