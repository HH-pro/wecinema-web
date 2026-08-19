"use client";

/**
 * "My Rentals" — the viewer's rented library.
 *
 * Client-rendered because rentals are per-user and the access token lives in
 * memory only; there is no identity available during SSR.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { listMyRentals } from "@/features/watch/api/rental.service";
import type { MyRental } from "@/features/watch/types/rental.types";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "active" | "expired";

function remaining(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default function MyRentalsPage() {
  const { status } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("active");
  const [rentals, setRentals] = useState<MyRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // The fetch is inlined here (rather than a useCallback the effect invokes) so
  // every setState lands in an async continuation. setLoading(true) is driven
  // by the tab click below — setting it synchronously in the effect body would
  // cascade renders.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    (async () => {
      try {
        const res = await listMyRentals(tab);
        if (!cancelled) setRentals(res.rentals ?? []);
      } catch {
        if (!cancelled) setRentals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, tab]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 64px" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)" }}>
        My Rentals
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--color-text-tertiary)" }}>
        Films you&apos;ve rented. Once you press play you have a limited window to finish watching.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {(["active", "expired"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              if (t !== tab) setLoading(true);
              setTab(t);
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "capitalize",
              cursor: "pointer",
              border: tab === t ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
              backgroundColor: tab === t ? "rgba(255,187,0,0.12)" : "transparent",
              color: tab === t ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 190, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && rentals.length === 0 && (
        <EmptyState
          title={tab === "active" ? "No active rentals" : "No expired rentals"}
          description={
            tab === "active"
              ? "Films you rent will appear here with the time you have left to watch them."
              : "Rentals that have run out will be listed here."
          }
        />
      )}

      {!loading && rentals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {rentals.map((r) => {
            const card = (
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--color-border-secondary)",
                  backgroundColor: "var(--color-bg-elevated)",
                  height: "100%",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "16/9", backgroundColor: "#000" }}>
                  {r.video.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.video.thumbnail}
                      alt={r.video.title ?? ""}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: r.isActive ? 1 : 0.45,
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 9999,
                      backgroundColor: r.isActive ? "rgba(245,158,11,0.92)" : "rgba(0,0,0,0.7)",
                      color: r.isActive ? "#000" : "#fff",
                    }}
                  >
                    {r.isActive ? remaining(r.expiresAt) : "Expired"}
                  </span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.video.title ?? "Untitled"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    {r.firstPlayedAt
                      ? `Started ${new Date(r.firstPlayedAt).toLocaleDateString()}`
                      : `Not started · ${r.playWindowHours}h once you press play`}
                  </p>
                </div>
              </div>
            );

            return r.watchUrl ? (
              <Link key={r._id} href={r.watchUrl} style={{ textDecoration: "none" }}>
                {card}
              </Link>
            ) : (
              <div key={r._id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
