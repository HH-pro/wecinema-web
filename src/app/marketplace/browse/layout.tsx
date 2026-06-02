import type { Metadata } from "next";

// The page is a client component and can't export metadata itself, so this
// sibling layout supplies the title + self-referencing canonical for indexing.
export const metadata: Metadata = {
  title: { absolute: "Browse the Film Marketplace | WeCinema" },
  description:
    "Browse films, scripts, licensing and adaptation rights for sale from independent creators on the WeCinema marketplace.",
  alternates: { canonical: "/marketplace/browse" },
};

export default function MarketplaceBrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
