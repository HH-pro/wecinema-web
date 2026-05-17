import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { HistoryClient } from "@/features/profile/components/HistoryClient";

export const metadata: Metadata = {
  title: "Watch History | WeCinema",
  robots: { index: false },
};

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Layout>
      <HistoryClient userId={id} />
    </Layout>
  );
}
