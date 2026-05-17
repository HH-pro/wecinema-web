import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getVideosByCategory } from "@/features/videos/api/videoQueries";
import { VideoCard } from "@/features/videos/components/VideoCard";

interface VideoGalleryProps {
  title: string;
  category: string;
  viewAllHref: string;
  limit?: number;
  prioritizeFirst?: boolean;
}

export async function VideoGallery({ title, category, viewAllHref, limit = 6, prioritizeFirst = false }: VideoGalleryProps) {
  const videos = await getVideosByCategory(category, limit);

  return (
    <section style={{ padding: "24px 24px 32px" }} aria-labelledby={`section-${category}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <h2
          id={`section-${category}`}
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h2>
        <Link
          href={viewAllHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-accent-primary)",
            border: "1px solid var(--color-accent-primary)",
            borderRadius: 12,
            padding: "6px 14px",
            whiteSpace: "nowrap",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          className="hover:!bg-[var(--color-accent-primary)] hover:!text-white"
        >
          View all <ChevronRight size={13} aria-hidden />
        </Link>
      </div>

      {videos.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
          No videos in {title} yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {videos.map((video, i) => (
            <VideoCard key={video._id} video={video} priority={prioritizeFirst && i === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
