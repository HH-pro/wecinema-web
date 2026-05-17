export const CATEGORIES = [
  "Action", "Adventure", "Comedy", "Documentary", "Drama",
  "Horror", "Mystery", "Romance", "Thriller",
] as const;

export const THEMES = [
  "Love", "Redemption", "Family", "Oppression", "Corruption",
  "Survival", "Revenge", "Death", "Justice", "Perseverance",
  "War", "Bravery", "Freedom", "Friendship", "Hope",
  "Society", "Isolation", "Peace",
] as const;

export const RATINGS = ["G", "PG", "PG-13", "R"] as const;

export const RATING_META: Record<string, { label: string; color: string }> = {
  G: { label: "General Audiences", color: "#22C55E" },
  PG: { label: "Parental Guidance", color: "#3B82F6" },
  "PG-13": { label: "Parents Cautioned", color: "#F59E0B" },
  R: { label: "Restricted", color: "#EF4444" },
};

export const SIDEBAR_EXPANDED_W = 240;
export const SIDEBAR_COLLAPSED_W = 68;
