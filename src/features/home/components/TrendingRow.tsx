import { Flame } from "lucide-react";
import { MediaRow } from "@/features/home/components/MediaRow";
import { VideoCard } from "@/features/videos/components/VideoCard";
import type { Video } from "@/types";

export function TrendingRow({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <MediaRow
      title="Trending Now"
      viewAllHref="/explore"
      icon={<Flame size={18} color="var(--color-accent-primary)" aria-hidden />}
    >
      {videos.map((v, i) => (
        <VideoCard key={v._id} video={v} priority={i === 0} />
      ))}
    </MediaRow>
  );
}
