import type { Metadata } from "next";

// Private, per-user liked-videos list — never index.
export const metadata: Metadata = {
  title: { absolute: "Liked Videos | WeCinema" },
  robots: { index: false, follow: false },
};

export default function LikedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
