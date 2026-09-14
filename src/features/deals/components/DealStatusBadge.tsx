import { Ban, CheckCircle2, Clock, Hourglass, ShieldCheck, XCircle } from "lucide-react";
import { statusMeta } from "../lib/dealFormat";
import type { DealStatus } from "../types/deal.types";

const ICONS: Record<DealStatus, typeof Clock> = {
  pending: Clock,
  negotiating: Clock,
  accepted: CheckCircle2,
  paid: ShieldCheck,
  completed: CheckCircle2,
  declined: XCircle,
  cancelled: Ban,
  expired: Hourglass,
};

export function DealStatusBadge({ status, className = "" }: { status: DealStatus; className?: string }) {
  const { label, badgeClass } = statusMeta(status);
  const Icon = ICONS[status] ?? Clock;
  return (
    <span className={`mp-badge ${badgeClass} whitespace-nowrap ${className}`}>
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
