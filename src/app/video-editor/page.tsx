import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";
import VideoEditorLoader from "./VideoEditorLoader";

const EDITOR_TITLE = "Online Video Editor for Filmmakers | WeCinema";
const EDITOR_DESCRIPTION =
  "Edit your films and videos directly on WeCinema with built-in creator editing tools.";

export const metadata: Metadata = {
  title: { absolute: EDITOR_TITLE },
  description: EDITOR_DESCRIPTION,
  alternates: { canonical: "/video-editor" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: EDITOR_TITLE,
    description: EDITOR_DESCRIPTION,
    images: [{ url: OG.video, width: 1200, height: 630, alt: "WeCinema Video Editor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: EDITOR_TITLE,
    description: EDITOR_DESCRIPTION,
    images: [OG.video],
  },
};

export default function VideoEditorPage() {
  return (
    <Layout>
      <VideoEditorLoader />
    </Layout>
  );
}
