import type { Metadata } from "next";

// Private buyer/seller negotiations — never index.
export const metadata: Metadata = {
  title: { absolute: "My Deals | WeCinema" },
  robots: { index: false, follow: false },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
