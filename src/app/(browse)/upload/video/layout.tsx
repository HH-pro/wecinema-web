import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Upload Your Film | WeCinema";
const DESCRIPTION =
  "Upload and stream your film on WeCinema with creator tools, analytics, and audience discovery features.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/upload/video" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/upload/video`,
    images: [{ url: OG.videoUpload, width: 1200, height: 630, alt: "Upload Your Film on WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.videoUpload],
  },
};

export default function UploadVideoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
