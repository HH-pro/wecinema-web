import type { ReactNode } from "react";
import { CalendarDays, DollarSign, FileText, Globe } from "lucide-react";
import { formatCents, statusMeta, termLabel, territoryLabel } from "../lib/dealFormat";
import type { Deal } from "../types/deal.types";

export function StatTile({
  icon,
  label,
  value,
  accentValue = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accentValue?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-card-border bg-card-bg p-3">
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-accent"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 14%, transparent)" }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] text-text-tertiary">{label}</span>
        <span className={`block truncate text-sm font-bold ${accentValue ? "text-accent" : "text-text-primary"}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

export function DealStatTiles({ deal }: { deal: Pick<Deal, "terms" | "status"> }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <StatTile icon={<DollarSign size={15} />} label="Offer Amount" value={formatCents(deal.terms.amountCents)} />
      <StatTile icon={<Globe size={15} />} label="Territory" value={territoryLabel(deal.terms.territory, true)} />
      <StatTile icon={<CalendarDays size={15} />} label="Term Length" value={termLabel(deal.terms.termMonths)} />
      <StatTile icon={<FileText size={15} />} label="Status" value={statusMeta(deal.status).label} accentValue />
    </div>
  );
}
