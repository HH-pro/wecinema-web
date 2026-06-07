import type { Metadata } from "next";

// Private, per-user buyer stats — never index.
export const metadata: Metadata = {
  title: { absolute: "Stats | WeCinema" },
  robots: { index: false, follow: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
