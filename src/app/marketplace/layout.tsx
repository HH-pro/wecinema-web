import "./marketplace.css";
import Layout from "@/components/layout/Layout";
import { MarketplaceAccessGuard } from "@/features/marketplace/components/MarketplaceAccessGuard";

export default function MarketplaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <MarketplaceAccessGuard>{children}</MarketplaceAccessGuard>
    </Layout>
  );
}
