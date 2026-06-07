import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Seller Dashboard | WeCinema" },
  description:
    "Track listings, sales, offers, and creator analytics through your seller dashboard.",
  alternates: { canonical: "/marketplace/dashboard/seller" },
  // Private, per-user dashboard — no SEO value and shows a login wall to crawlers.
  robots: { index: false, follow: false },
};

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
