import { MediaRow } from "@/features/home/components/MediaRow";
import { VideoCard } from "@/features/videos/components/VideoCard";
import type { GenreBucket } from "@/features/home/api/homepageQueries";

/**
 * Renders one horizontal row per genre. Only non-empty genres are passed in
 * (filtered in getHomepageData), so there is never a "No videos" placeholder.
 */
export function GenreRows({ buckets }: { buckets: GenreBucket[] }) {
  if (buckets.length === 0) return null;
  return (
    <>
      {buckets.map((bucket) => (
        <MediaRow key={bucket.genre}>
          {bucket.videos.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </MediaRow>
      ))}
    </>
  );
}
