import type { Metadata } from "next";

/**
 * Private deal surface — redirects into a specific deal. Never a search result.
 */
export const metadata: Metadata = {
  title: "Counter offer",
  robots: { index: false, follow: false },
};

export default function CounterOfferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
