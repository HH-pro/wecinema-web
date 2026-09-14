"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertCircle, Plus, Search, X } from "lucide-react";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "@/lib/toast";
import { cancelDeal } from "../api/deal.service";
import { DealCard } from "../components/DealCard";
import { DealConfirmModal } from "../components/DealConfirmModal";
import { DealFilterChips } from "../components/DealFilterChips";
import { DealEmptyState } from "../components/DealStates";
import { DealsStats } from "../components/DealsStats";
import { dealErrorMessage, useDeals } from "../hooks/useDeals";
import { FILTER_CHIPS } from "../lib/constants";
import type { Deal, DealFilter } from "../types/deal.types";

export default function MyDealsView() {
  const { authUser } = useAuth();
  const [status, setStatus] = useState<DealFilter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { items, counts, stats, pagination, loading, error, refetch } = useDeals({ status, q, page });

  const [withdrawing, setWithdrawing] = useState<Deal | null>(null);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const changeStatus = (next: DealFilter) => {
    setStatus(next);
    setPage(1);
  };

  const changeQuery = (next: string) => {
    setQ(next);
    setPage(1);
  };

  const confirmWithdraw = useCallback(
    async (reason?: string) => {
      if (!withdrawing) return;
      setWithdrawBusy(true);
      try {
        await cancelDeal(withdrawing._id, reason ? { reason } : {});
        toast.success("Deal withdrawn");
        setWithdrawing(null);
        refetch();
      } catch (err) {
        toast.error(dealErrorMessage(err, "Could not withdraw this deal."));
        refetch();
      } finally {
        setWithdrawBusy(false);
      }
    },
    [withdrawing, refetch],
  );

  const activeChipLabel = FILTER_CHIPS.find((c) => c.value === status)?.label ?? "";
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">My Deals</h1>
            <p className="mt-0.5 text-xs text-text-tertiary sm:text-sm">
              Track all negotiations, agreements, and completed rights deals.
            </p>
          </div>
          <Link href="/marketplace/browse" className="mp-btn mp-btn-secondary mp-btn-sm">
            <Plus size={14} aria-hidden="true" />
            Find a Film
          </Link>
        </header>

        <DealsStats stats={stats} loading={loading} />

        <div className="mp-card space-y-3 p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Search deals by title, seller, or deal type…"
              aria-label="Search deals"
              className="mp-input !py-2 !pl-9 !pr-8 !text-xs"
            />
            {q && (
              <button
                type="button"
                onClick={() => changeQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <DealFilterChips value={status} counts={counts} onChange={changeStatus} />
        </div>

        {error ? (
          <div className="mp-alert mp-alert-danger items-center">
            <AlertCircle size={16} className="flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-sm">{error}</span>
            <button type="button" onClick={() => refetch()} className="text-xs underline">
              Retry
            </button>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading deals">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mp-skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          q || status !== "all" ? (
            <DealEmptyState
              title="No matching deals"
              text={q ? `Nothing matches “${q}”${status !== "all" ? ` in ${activeChipLabel}` : ""}.` : `You have no ${activeChipLabel.toLowerCase()} deals.`}
            />
          ) : (
            <DealEmptyState
              title="No deals yet"
              text="Make an offer on a listing to start negotiating licensing or rights terms."
              action={{ href: "/marketplace/browse", label: "Browse Listings" }}
            />
          )
        ) : (
          <div className={`space-y-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {items.map((deal) => (
              <DealCard key={deal._id} deal={deal} userId={authUser?._id} onWithdraw={setWithdrawing} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-3 pt-1" aria-label="Pagination">
            <button
              type="button"
              className="mp-btn mp-btn-secondary mp-btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-xs text-text-tertiary">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="mp-btn mp-btn-secondary mp-btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </div>

      <DealConfirmModal
        open={!!withdrawing}
        title="Withdraw this deal?"
        description={
          <>
            <strong className="text-text-primary">{withdrawing?.listing.title}</strong> will be closed for both sides. You can
            start a new deal on this listing later.
          </>
        }
        confirmLabel="Withdraw Deal"
        tone="danger"
        withReason
        busy={withdrawBusy}
        onConfirm={confirmWithdraw}
        onClose={() => setWithdrawing(null)}
      />
    </MarketplaceLayout>
  );
}
