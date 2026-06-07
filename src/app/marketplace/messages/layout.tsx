import type { Metadata } from "next";

// Private 1:1 buyer/seller chat — never index.
export const metadata: Metadata = {
  title: { absolute: "Messages | WeCinema" },
  robots: { index: false, follow: false },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
