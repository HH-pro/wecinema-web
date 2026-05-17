"use client";

import { useState, useEffect } from "react";
import { HypemodeAuthDrawer } from "@/app/hypemode/HypemodeAuthDrawer";
import type { Video } from "@/types";
import { VideoPlayer } from "@/features/watch/components/VideoPlayer";
import { VideoMeta } from "@/features/watch/components/VideoMeta";
import { AuthorSection } from "@/features/watch/components/AuthorSection";
import { CommentsSection } from "@/features/watch/components/CommentsSection";
import { RelatedVideos } from "@/features/watch/components/RelatedVideos";

export function WatchClient({ video }: { video: Video }) {
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [authDrawerTab, setAuthDrawerTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    function handleOpenAuth(e: Event) {
      const detail = (e as CustomEvent<{ tab?: "login" | "signup" }>).detail;
      setAuthDrawerTab(detail?.tab ?? "login");
      setAuthDrawerOpen(true);
    }
    window.addEventListener("wecinema:open-auth", handleOpenAuth);
    return () => window.removeEventListener("wecinema:open-auth", handleOpenAuth);
  }, []);

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "24px 16px 64px",
        display: "flex",
        flexDirection: "row",
        gap: 32,
        alignItems: "flex-start",
      }}
      className="watch-layout"
    >
      <style>{`
        @media (max-width: 900px) {
          .watch-layout { flex-direction: column !important; }
          .watch-aside { width: 100% !important; }
        }
      `}</style>

      <main style={{ flex: 1, minWidth: 0 }}>
        <VideoPlayer video={video} />
        <VideoMeta video={video} />
        <AuthorSection video={video} />
        <CommentsSection video={video} />
      </main>

      <aside
        className="watch-aside"
        style={{ width: 380, flexShrink: 0 }}
      >
        <RelatedVideos genres={video.genre} excludeId={video._id} />
      </aside>

      <HypemodeAuthDrawer
        open={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        defaultTab={authDrawerTab}
      />
    </div>
  );
}
