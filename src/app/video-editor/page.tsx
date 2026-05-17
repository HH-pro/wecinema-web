import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import VideoEditorLoader from "./VideoEditorLoader";

export const metadata: Metadata = {
  title: "Video Editor",
  description: "Edit videos in the browser — add text overlays, apply filters, adjust audio, and export.",
  alternates: { canonical: "/video-editor" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "Video Editor | WeCinema",
    description: "Edit videos in the browser — add text overlays, apply filters, adjust audio, and export.",
    images: [{ url: "/seo/Video.webp", width: 1200, height: 630, alt: "WeCinema Video Editor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Editor | WeCinema",
    description: "Edit videos in the browser — add text overlays, apply filters, adjust audio, and export.",
    images: ["/seo/Video.webp"],
  },
};

export default function VideoEditorPage() {
  return (
    <Layout>
      <VideoEditorLoader />
    </Layout>
  );
}
