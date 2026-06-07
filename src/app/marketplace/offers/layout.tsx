import type { Metadata } from "next";

// Private buyer/seller offer negotiations — never index.
export const metadata: Metadata = {
  title: { absolute: "Offers | WeCinema" },
  robots: { index: false, follow: false },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
