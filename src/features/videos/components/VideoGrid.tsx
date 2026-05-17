import { Film } from "lucide-react";
import { VideoCard } from "./VideoCard";
import type { Video } from "@/types";

interface VideoGridProps {
  videos: Video[];
  emptyMessage?: string;
}

export function VideoGrid({ videos, emptyMessage = "No videos found." }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          gap: 12,
          color: "var(--color-text-tertiary)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={22} />
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 20,
      }}
    >
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}
