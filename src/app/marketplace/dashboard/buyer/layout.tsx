import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Buyer Dashboard | WeCinema" },
  description:
    "Manage purchases, saved listings, and creator connections through your buyer dashboard.",
  alternates: { canonical: "/marketplace/dashboard/buyer" },
  // Private, per-user dashboard — no SEO value and shows a login wall to crawlers.
  robots: { index: false, follow: false },
};

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
