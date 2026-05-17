import "./marketplace.css";
import Layout from "@/components/layout/Layout";

export default function MarketplaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
