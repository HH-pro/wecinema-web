import type { Metadata } from "next";
import NewDealView from "@/features/deals/views/NewDealView";

export const metadata: Metadata = {
  title: { absolute: "Make an Offer | WeCinema" },
};

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { listing } = await searchParams;
  return <NewDealView listingId={typeof listing === "string" ? listing : undefined} />;
}
