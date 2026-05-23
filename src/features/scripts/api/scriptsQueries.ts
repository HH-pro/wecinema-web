import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import type { Script } from "@/types";

interface ScriptsResponse {
  scripts?: Script[];
  data?: Script[];
}

export async function getLatestScripts(limit = 6): Promise<Script[]> {
  try {
    const data = await apiFetch<ScriptsResponse | Script[]>(
      `/video/author/scripts?limit=${limit}`,
      {
        revalidate: 60,
        tags: ["scripts:latest"],
      },
    );

    const list = Array.isArray(data) ? data : data.scripts ?? data.data ?? [];
    return list.slice(0, limit);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`[scripts] ${err.status} ${err.statusText}`);
    } else {
      console.error("[scripts]", err);
    }
    return [];
  }
}
