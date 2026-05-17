import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";
import ReportContent from "./ReportContent";

export const metadata: Metadata = {
  title: "Report Content",
  description: "Help us keep WeCinema safe by reporting inappropriate content.",
  alternates: { canonical: "/report" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "Report Content | WeCinema",
    description: "Help us keep WeCinema safe by reporting inappropriate content.",
    images: [{ url: OG.report, width: 1200, height: 630, alt: "Report Content on WeCinema" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Report Content | WeCinema",
    description: "Help us keep WeCinema safe by reporting inappropriate content.",
    images: [OG.report],
  },
};

export default function ReportPage() {
  return (
    <Layout>
      <ReportContent />
    </Layout>
  );
}
