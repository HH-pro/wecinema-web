import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Seller Dashboard | WeCinema" },
  description:
    "Track listings, sales, offers, and creator analytics through your seller dashboard.",
  alternates: { canonical: "/marketplace/dashboard/seller" },
};

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
