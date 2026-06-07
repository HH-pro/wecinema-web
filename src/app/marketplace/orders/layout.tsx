import type { Metadata } from "next";

// Private, per-user order history & order details — never index.
export const metadata: Metadata = {
  title: { absolute: "Orders | WeCinema" },
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
