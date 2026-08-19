"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { HypemodeAuthDrawer } from "@/app/hypemode/HypemodeAuthDrawer";
import type { Video } from "@/types";
import { VideoPlayer } from "@/features/watch/components/VideoPlayer";
import { VideoMeta } from "@/features/watch/components/VideoMeta";
import { AuthorSection } from "@/features/watch/components/AuthorSection";
import { CommentsSection } from "@/features/watch/components/CommentsSection";
import { RelatedVideos } from "@/features/watch/components/RelatedVideos";

// Stripe.js is ~230KB. Loading the rent modal lazily keeps it off every watch
// page — it only arrives when someone actually opens checkout.
const RentModal = dynamic(() => import("@/features/watch/components/RentModal"), {
  ssr: false,
});

export function WatchClient({ video }: { video: Video }) {
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [authDrawerTab, setAuthDrawerTab] = useState<"login" | "signup">("login");
  const [rentOpen, setRentOpen] = useState(false);

  useEffect(() => {
    function handleOpenAuth(e: Event) {
      const detail = (e as CustomEvent<{ tab?: "login" | "signup" }>).detail;
      setAuthDrawerTab(detail?.tab ?? "login");
      setAuthDrawerOpen(true);
    }
    window.addEventListener("wecinema:open-auth", handleOpenAuth);
    return () => window.removeEventListener("wecinema:open-auth", handleOpenAuth);
  }, []);

  // The player asks for checkout via an event so it doesn't own modal state
  // (and doesn't pull Stripe into its own chunk). Same indirection as the
  // auth drawer above.
  useEffect(() => {
    function handleOpenRent() {
      setRentOpen(true);
    }
    window.addEventListener("wecinema:open-rent", handleOpenRent);
    return () => window.removeEventListener("wecinema:open-rent", handleOpenRent);
  }, []);

  const handleRentSuccess = useCallback(() => {
    setRentOpen(false);
    // Tell the player to re-check entitlement — it will swap the paywall for
    // the play button without a page reload.
    window.dispatchEvent(new CustomEvent("wecinema:rental-activated"));
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

      {rentOpen && (
        <RentModal
          videoId={video._id}
          title={video.title}
          thumbnail={video.thumbnail}
          onClose={() => setRentOpen(false)}
          onSuccess={handleRentSuccess}
        />
      )}
    </div>
  );
}
