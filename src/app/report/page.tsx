import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import ReportContent from "./ReportContent";

export const metadata: Metadata = {
  title: "Report Content",
  description: "Help us keep WeCinema safe by reporting inappropriate content.",
  alternates: { canonical: "/report" },
  robots: { index: false, follow: true },
};

export default function ReportPage() {
  return (
    <Layout>
      <ReportContent />
    </Layout>
  );
}
