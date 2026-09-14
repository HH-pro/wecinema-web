import { notFound } from "next/navigation";
import DealRoomView from "@/features/deals/views/DealRoomView";
import { isValidDealId } from "@/features/deals/components/DealStates";

export default async function DealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidDealId(id)) notFound();
  return <DealRoomView dealId={id} />;
}
