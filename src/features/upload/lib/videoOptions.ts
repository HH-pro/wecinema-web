// Must match RENTAL_PLANS in wecinema-backend/src/models/videos.js — the
// backend rejects any price that isn't one of these, and derives the play
// window from the price alone.
export const RENTAL_PLANS = [
  { priceCents: 500,  playWindowHours: 1,  label: "1 hour"   },
  { priceCents: 1000, playWindowHours: 48, label: "48 hours" },
] as const;

export const DEFAULT_RENTAL_CENTS = RENTAL_PLANS[1].priceCents;

// The backend keeps 10% (config.PLATFORM_FEE_PERCENT_DECIMAL).
export const PLATFORM_FEE_RATE = 0.1;

export const GENRES = [
  "Action", "Adventure", "Comedy", "Documentary",
  "Drama", "Horror", "Love", "Mystery", "Romance", "Thriller",
];

export const THEMES = [
  "Coming-of-age story", "Good versus evil", "Love", "Redemption",
  "Family", "Death", "Oppression", "Survival", "Revenge", "Justice",
  "War", "Bravery", "Freedom", "Friendship", "Isolation", "Peace", "Perseverance",
];

export const RATINGS = [
  { value: "G",     label: "G",     sub: "General Audience"           },
  { value: "PG",    label: "PG",    sub: "Parental Guidance"           },
  { value: "PG-13", label: "PG-13", sub: "Parents Strongly Cautioned"  },
  { value: "R",     label: "R",     sub: "Restricted"                  },
];

export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/ogg";
