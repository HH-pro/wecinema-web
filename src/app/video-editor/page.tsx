import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Layout from "@/components/layout/Layout";

// Lazy-load the heavy editor on the client only — keeps FFmpeg / Fabric.js
// out of the initial JS bundle and prevents SSR errors from browser-only APIs.
const VideoEditorContent = dynamic(() => import("./VideoEditorContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--color-text-secondary)",
        fontSize: 14,
      }}
    >
      Loading editor…
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Video Editor",
  description: "Edit videos in the browser — add text overlays, apply filters, adjust audio, and export.",
  alternates: { canonical: "/video-editor" },
};

export default function VideoEditorPage() {
  return (
    <Layout>
      <VideoEditorContent />
    </Layout>
  );
}
