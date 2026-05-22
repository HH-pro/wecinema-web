import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Marketplace Analytics | WeCinema" },
  description:
    "Analyze marketplace trends, genres, audience behavior, and creator performance data.",
  alternates: { canonical: "/marketplace/analytics" },
};

export default function MarketplaceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
