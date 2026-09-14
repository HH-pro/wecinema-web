import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CounterOfferView from "@/features/deals/views/CounterOfferView";
import { isValidDealId } from "@/features/deals/components/DealStates";

export const metadata: Metadata = {
  title: { absolute: "Counter Offer | WeCinema" },
};

export default async function CounterOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidDealId(id)) notFound();
  return <CounterOfferView dealId={id} />;
}
