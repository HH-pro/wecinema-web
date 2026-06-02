import type { Metadata } from "next";

// Client-component page — metadata lives here so the route is indexable with a
// self-referencing canonical instead of inheriting the homepage canonical.
export const metadata: Metadata = {
  title: { absolute: "Marketplace Resources | WeCinema" },
  description:
    "Guides, tools, and resources for filmmakers and buyers using the WeCinema marketplace.",
  alternates: { canonical: "/marketplace/resources" },
};

export default function MarketplaceResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
