import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import type { Script } from "@/types";

interface ScriptsResponse {
  scripts?: Script[];
  data?: Script[];
}

async function fetchAllScripts(): Promise<Script[]> {
  const data = await apiFetch<ScriptsResponse | Script[]>(
    `/video/author/scripts`,
    {
      revalidate: 60,
      tags: ["scripts:latest"],
    },
  );
  return Array.isArray(data) ? data : data.scripts ?? data.data ?? [];
}

function sortNewestFirst(list: Script[]): Script[] {
  return [...list].sort((a, b) => {
    const da = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
    const db = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
    return db - da;
  });
}

export async function getLatestScripts(limit = 6): Promise<Script[]> {
  try {
    return sortNewestFirst(await fetchAllScripts()).slice(0, limit);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[scripts] ${err.status} ${err.statusText}`);
    } else {
      console.error("[scripts]", err);
    }
    return [];
  }
}

/** Latest scripts plus the total count (for the homepage analytics counters). */
export async function getScriptsWithCount(
  limit = 6,
): Promise<{ scripts: Script[]; total: number }> {
  try {
    const all = await fetchAllScripts();
    return { scripts: sortNewestFirst(all).slice(0, limit), total: all.length };
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[scripts] ${err.status} ${err.statusText}`);
    } else {
      console.error("[scripts]", err);
    }
    return { scripts: [], total: 0 };
  }
}
