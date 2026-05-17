import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import VideoEditorLoader from "./VideoEditorLoader";

export const metadata: Metadata = {
  title: "Video Editor",
  description: "Edit videos in the browser — add text overlays, apply filters, adjust audio, and export.",
  alternates: { canonical: "/video-editor" },
};

export default function VideoEditorPage() {
  return (
    <Layout>
      <VideoEditorLoader />
    </Layout>
  );
}
