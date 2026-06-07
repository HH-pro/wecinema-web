import type { Metadata } from "next";

// Private, per-user bookmark list — never index.
export const metadata: Metadata = {
  title: { absolute: "Bookmarks | WeCinema" },
  robots: { index: false, follow: false },
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
