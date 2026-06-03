import { apiFetch } from "@/lib/fetch/serverFetch";
import type { GraphData, GraphDateParams } from "@/types";

/**
 * Preloads the 3 homepage analytics graphs (genres / themes / ratings) on the
 * server at page-load time, so the in-banner charts render instantly when the
 * user slides to the analytics slide — no client fetch + loading flicker.
 *
 * Mirrors exactly what Charts.tsx fetched client-side: the same endpoints, the
 * same 90-day window, and `json.data ?? json`. ISR-cached so it costs nothing
 * on repeat loads.
 */

export interface AnalyticsGraphs {
  genres: GraphData;
  themes: GraphData;
  ratings: GraphData;
  range: GraphDateParams;
}

const CACHE_TTL = 300;

function range90(): GraphDateParams {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

/** Coerce any endpoint payload into a GraphData object (arrays → {}). */
function asGraphData(payload: unknown): GraphData {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as GraphData;
  }
  return {};
}

async function fetchGraph(endpoint: string, range: GraphDateParams): Promise<GraphData> {
  try {
    const qs = `?from=${range.from}&to=${range.to}`;
    const json = await apiFetch<{ data?: unknown } | unknown>(`${endpoint}${qs}`, {
      revalidate: CACHE_TTL,
      tags: ["analytics:graphs"],
    });
    const data = (json as { data?: unknown })?.data ?? json;
    return asGraphData(data);
  } catch {
    return {};
  }
}

export async function getAnalyticsGraphs(): Promise<AnalyticsGraphs> {
  const range = range90();
  const [genres, themes, ratings] = await Promise.all([
    fetchGraph("/video/genres/graph", range),
    fetchGraph("/video/themes/graph", range),
    fetchGraph("/video/ratings/graph", range),
  ]);
  return { genres, themes, ratings, range };
}
