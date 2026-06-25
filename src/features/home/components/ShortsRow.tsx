import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { ShortsCard } from "@/features/videos";
import type { Video } from "@/types";

export function ShortsRow({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <section style={{ padding: "20px var(--space-section-x) 28px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "clamp(1.15rem, 2.2vw, 1.45rem)",
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          <Clapperboard size={18} color="var(--color-accent-primary)" aria-hidden />
          Shorts
        </h2>
        <Link
          href="/shorts"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-accent-primary)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          View all →
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "thin",
        }}
        className="snap-x snap-mandatory sm:snap-none"
      >
        {videos.map((v, i) => (
          <div key={v._id} className="snap-start" style={{ width: 160, flexShrink: 0 }}>
            <ShortsCard video={v} priority={i === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
