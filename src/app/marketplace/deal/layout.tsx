import type { Metadata } from "next";

// Private buyer/seller negotiations — never index.
export const metadata: Metadata = {
  title: { absolute: "Deal Room | WeCinema" },
  robots: { index: false, follow: false },
};

export default function DealLayout({ children }: { children: React.ReactNode }) {
  return children;
}
