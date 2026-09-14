import { redirect } from "next/navigation";
import { isValidDealId } from "@/features/deals/components/DealStates";

/** Legacy/shared URL shape: /marketplace/counter-offer?deal=<id> → the deal's counter page. */
export default async function CounterOfferRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deal } = await searchParams;
  if (typeof deal === "string" && isValidDealId(deal)) {
    redirect(`/marketplace/deal/${deal}/counter`);
  }
  redirect("/marketplace/deals");
}
