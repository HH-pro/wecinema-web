import type { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { DealPoster } from "./DealPoster";
import { dealTypeLabel } from "../lib/dealFormat";
import type { Deal, DealParty } from "../types/deal.types";

function PartyRow({ label, party, role }: { label: string; party: DealParty; role: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-tertiary">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <Avatar src={party.avatar} username={party.username} size={24} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-text-primary">{party.username}</span>
          <span className="block text-[10px] text-text-tertiary">{role}</span>
        </span>
      </dd>
    </div>
  );
}

/** Film + parties card shared by the Deal Room, Counter Offer and New Deal screens. */
export function DealFilmHeader({ deal, badge }: { deal: Pick<Deal, "listing" | "buyer" | "seller" | "terms">; badge?: ReactNode }) {
  const { listing } = deal;
  const meta = [listing.genre, listing.year ? String(listing.year) : null].filter(Boolean).join(" • ");
  const title = listing.year ? `${listing.title} (${listing.year})` : listing.title;

  return (
    <section
      className="mp-card relative overflow-hidden p-4 sm:p-5"
      style={{
        backgroundImage:
          "radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--color-accent-primary) 10%, transparent), transparent 60%)",
      }}
    >
      {badge && <div className="mb-3 flex justify-end sm:absolute sm:right-4 sm:top-4 sm:mb-0">{badge}</div>}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <DealPoster src={listing.posterUrl} title={listing.title} className="h-24 w-20 sm:h-32 sm:w-28" />
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-snug text-text-primary sm:text-lg">{title}</h2>
            {meta && <p className="mt-0.5 text-xs capitalize text-text-tertiary">{meta}</p>}
            {listing.description && (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
                {listing.description}
              </p>
            )}
          </div>
        </div>

        <dl
          className={`grid grid-cols-3 gap-3 border-t border-divider pt-3 sm:grid-cols-1 sm:gap-2.5 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 ${
            badge ? "sm:pt-8" : ""
          }`}
        >
          <PartyRow label="Seller / Creator" party={deal.seller} role="Creator" />
          <PartyRow label="Buyer / Studio" party={deal.buyer} role="Studio" />
          <div className="min-w-0">
            <dt className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Deal Type</dt>
            <dd className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <Clapperboard size={13} className="flex-shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">{dealTypeLabel(deal.terms.dealType)}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
