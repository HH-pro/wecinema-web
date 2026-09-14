import { FILTER_CHIPS } from "../lib/constants";
import type { DealCounts, DealFilter } from "../types/deal.types";

interface DealFilterChipsProps {
  value: DealFilter;
  counts: DealCounts | null;
  onChange: (value: DealFilter) => void;
}

export function DealFilterChips({ value, counts, onChange }: DealFilterChipsProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Filter deals by status">
      {FILTER_CHIPS.map((chip) => {
        const active = chip.value === value;
        const count = counts?.[chip.value];
        return (
          <button
            key={chip.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.value)}
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
              active
                ? "border-accent text-accent"
                : "border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary"
            }`}
            style={active ? { backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" } : undefined}
          >
            {chip.label}
            {count != null && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                  active ? "bg-accent text-btn-primary-text" : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
