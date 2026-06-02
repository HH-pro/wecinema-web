import type { Metadata } from "next";

// Client-component page — metadata lives here so the route is indexable with a
// self-referencing canonical instead of inheriting the homepage canonical.
export const metadata: Metadata = {
  title: { absolute: "Marketplace Guide | WeCinema" },
  description:
    "Learn how to buy and sell films, scripts, and rights on the WeCinema marketplace — listings, offers, orders, and payouts explained.",
  alternates: { canonical: "/marketplace/guide" },
};

export default function MarketplaceGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
