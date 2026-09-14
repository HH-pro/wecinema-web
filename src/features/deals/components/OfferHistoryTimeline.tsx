import { History } from "lucide-react";
import { formatCents, formatDealDate, proposalDescription, proposalTitle } from "../lib/dealFormat";
import type { DealProposal } from "../types/deal.types";

export function OfferHistoryTimeline({ proposals }: { proposals: DealProposal[] }) {
  return (
    <section className="mp-card p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
        <History size={15} className="text-text-secondary" aria-hidden="true" />
        Offer History
      </h3>

      {proposals.length === 0 ? (
        <p className="text-xs text-text-tertiary">No offers yet.</p>
      ) : (
        <ol className="relative">
          {proposals.map((p, i) => {
            const isFirst = i === 0;
            const isLatest = i === proposals.length - 1;
            return (
              <li key={p._id ?? i} className="relative flex gap-3 pb-4 last:pb-0">
                {/* Connector line */}
                {!isLatest && (
                  <span className="absolute left-[5px] top-4 h-[calc(100%-12px)] w-px bg-divider" aria-hidden="true" />
                )}
                <span
                  className={`relative z-10 mt-1 h-[11px] w-[11px] flex-shrink-0 rounded-full border-2 ${
                    isFirst && !isLatest ? "border-text-tertiary bg-card-bg" : "border-accent"
                  }`}
                  style={
                    isLatest
                      ? {
                          backgroundColor: "var(--color-accent-primary)",
                          boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 25%, transparent)",
                        }
                      : undefined
                  }
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{proposalTitle(p.kind)}</p>
                    <p className="text-[10px] text-text-tertiary">{formatDealDate(p.createdAt)}</p>
                    <p className="text-[11px] text-text-secondary">
                      {proposalDescription(p.kind, p.byUsername, p.byRole)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold tabular-nums text-text-primary">
                    {formatCents(p.terms.amountCents)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
