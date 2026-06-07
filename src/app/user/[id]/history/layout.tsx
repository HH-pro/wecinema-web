import type { Metadata } from "next";

// Private, per-user watch history — never index.
export const metadata: Metadata = {
  title: { absolute: "Watch History | WeCinema" },
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
