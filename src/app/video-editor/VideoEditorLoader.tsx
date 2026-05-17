"use client";

import dynamic from "next/dynamic";

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

export default function VideoEditorLoader() {
  return <VideoEditorContent />;
}
