/**
 * SEO copy for the templated collection pages (category / theme / rating).
 *
 * These pages used to render only an <h1> + a film count (~150 words), which
 * Google treats as thin, near-duplicate templates that don't rank. This module
 * gives every genre, theme and rating a UNIQUE, keyword-rich intro + meta
 * description so each page targets real search intent ("watch action films
 * online", "horror movies streaming", etc.) and earns its place in the index.
 *
 * One source of truth: both generateMetadata() and the on-page intro read from
 * here, so the description a searcher sees in Google matches the page.
 */

export interface CollectionCopy {
  /** ~155-char meta description (search snippet). */
  description: string;
  /** 1-2 sentence on-page intro paragraph (unique body copy). */
  intro: string;
  /** Secondary/long-tail keywords woven into the page for topical depth. */
  keywords: string[];
}

const GENRE_COPY: Record<string, CollectionCopy> = {
  action: {
    description:
      "Watch independent action films online — high-stakes chases, fights and thrillers from filmmakers worldwide. Stream action movies free on WeCinema.",
    intro:
      "Action films live for momentum — the chase, the fight, the impossible escape. Browse independent action movies on WeCinema, from gritty street thrillers to large-scale set pieces, all uploaded by filmmakers you can support directly. Stream now, or buy and license titles in the marketplace.",
    keywords: ["watch action movies online", "indie action films", "action thrillers", "stream action movies free"],
  },
  adventure: {
    description:
      "Stream independent adventure films on WeCinema — journeys, quests and survival stories from indie filmmakers. Watch adventure movies online free.",
    intro:
      "Adventure is about the journey into the unknown — uncharted places, daring quests and characters tested far from home. Discover independent adventure films on WeCinema and follow stories that span continents, eras and imaginations, made by creators you can back directly.",
    keywords: ["watch adventure movies online", "indie adventure films", "quest movies", "survival adventure"],
  },
  comedy: {
    description:
      "Watch independent comedy films online — fresh, original and genuinely funny shorts and features from indie creators. Stream comedy movies on WeCinema.",
    intro:
      "Comedy is the hardest genre to get right, which is why fresh voices matter. Explore independent comedies on WeCinema — sharp satire, awkward romance, deadpan shorts and feel-good features — straight from the filmmakers who wrote and shot them.",
    keywords: ["watch comedy movies online", "indie comedy films", "funny short films", "comedy features"],
  },
  documentary: {
    description:
      "Stream independent documentaries on WeCinema — true stories, investigations and profiles from documentary filmmakers worldwide. Watch docs online.",
    intro:
      "Documentaries turn real life into cinema — the investigation, the portrait, the untold history. Watch independent documentaries on WeCinema covering the people, places and ideas that the big studios overlook, and support the documentarians behind them.",
    keywords: ["watch documentaries online", "indie documentary films", "true story films", "documentary streaming"],
  },
  drama: {
    description:
      "Watch independent drama films online — character-driven stories and emotional features from indie filmmakers. Stream drama movies free on WeCinema.",
    intro:
      "Drama is where film does its deepest work — real characters, hard choices and the moments that change a life. Stream independent drama films on WeCinema, from intimate character studies to sweeping ensemble stories, created by filmmakers you can follow and support.",
    keywords: ["watch drama movies online", "indie drama films", "character-driven films", "emotional dramas"],
  },
  horror: {
    description:
      "Watch independent horror films online — chilling shorts and features from indie horror filmmakers. Stream horror movies free on WeCinema.",
    intro:
      "Horror thrives on the independent stage, where filmmakers take the risks studios won't. Discover indie horror on WeCinema — slow-burn dread, supernatural shorts, creature features and psychological scares — and back the directors redefining the genre.",
    keywords: ["watch horror movies online", "indie horror films", "scary short films", "stream horror free"],
  },
  mystery: {
    description:
      "Stream independent mystery films on WeCinema — whodunits, noir and suspense from indie filmmakers. Watch mystery movies online free.",
    intro:
      "Mystery rewards the patient viewer — the clue you missed, the suspect you trusted, the twist you never saw coming. Watch independent mystery films on WeCinema, from neo-noir features to tightly plotted shorts, made by storytellers who love a puzzle.",
    keywords: ["watch mystery movies online", "indie mystery films", "whodunit films", "noir thrillers"],
  },
  romance: {
    description:
      "Watch independent romance films online — love stories, dramas and rom-coms from indie filmmakers. Stream romance movies free on WeCinema.",
    intro:
      "Romance is the genre of connection — first meetings, second chances and everything that gets in the way. Stream independent romance films on WeCinema, from heartfelt features to bittersweet shorts, all from filmmakers telling love stories their own way.",
    keywords: ["watch romance movies online", "indie romance films", "love story films", "romantic shorts"],
  },
  thriller: {
    description:
      "Stream independent thriller films on WeCinema — tense, twisting stories from indie filmmakers. Watch thriller movies online free.",
    intro:
      "Thrillers keep you one step behind the characters and two steps from the edge of your seat. Discover independent thrillers on WeCinema — psychological, crime and suspense stories that build tension scene by scene — from filmmakers you can support directly.",
    keywords: ["watch thriller movies online", "indie thriller films", "psychological thrillers", "suspense films"],
  },
};

const RATING_COPY: Record<string, CollectionCopy> = {
  G: {
    description:
      "Watch G-rated films online — family-friendly movies suitable for all ages on WeCinema. Stream independent general-audience films free.",
    intro:
      "G-rated films are suitable for general audiences of every age, with nothing that would worry a parent. Browse independent G-rated movies on WeCinema — warm, accessible stories the whole family can watch together.",
    keywords: ["family friendly movies", "all ages films", "G rated movies online", "kids movies streaming"],
  },
  PG: {
    description:
      "Watch PG-rated films online — movies that may need parental guidance on WeCinema. Stream independent PG films suitable for most ages.",
    intro:
      "PG-rated films are broadly suitable but may contain material some parents prefer to preview. Explore independent PG movies on WeCinema — bigger themes and lightly mature moments, still welcoming for most viewers.",
    keywords: ["PG rated movies online", "parental guidance films", "family movies", "PG films streaming"],
  },
  "PG-13": {
    description:
      "Watch PG-13 films online — movies where parents are strongly cautioned, on WeCinema. Stream independent PG-13 films for teens and up.",
    intro:
      "PG-13 films may include intense scenes, language or themes that aren't suitable for younger children. Discover independent PG-13 movies on WeCinema — bolder, more mature stories aimed at teen and adult audiences.",
    keywords: ["PG-13 movies online", "teen movies", "mature films", "PG-13 films streaming"],
  },
  R: {
    description:
      "Watch R-rated films online — mature, restricted independent movies on WeCinema. Stream R-rated films intended for adult audiences.",
    intro:
      "R-rated films are intended for adult audiences and may contain strong language, violence or mature themes. Browse independent R-rated movies on WeCinema — uncompromising stories from filmmakers working without limits.",
    keywords: ["R rated movies online", "adult films", "mature independent films", "restricted movies streaming"],
  },
};

/** Themes get a one-line unique angle so each page is genuinely distinct. */
const THEME_ANGLE: Record<string, string> = {
  love: "the pull between people, and everything it costs them",
  redemption: "characters fighting to earn back what they lost",
  family: "the bonds, debts and battles that define a family",
  oppression: "people pushed down by power, and how they push back",
  corruption: "how power decays the people who hold it",
  survival: "ordinary people doing whatever it takes to live",
  revenge: "the cost of getting even — and who pays it",
  death: "mortality, grief and what comes after",
  justice: "the line between the law and what is right",
  perseverance: "the refusal to quit against impossible odds",
  war: "conflict on the battlefield and the lives it reshapes",
  bravery: "courage tested when everything is on the line",
  freedom: "the fight to break free and stay free",
  friendship: "loyalty, betrayal and the friends who define us",
  hope: "light found in the darkest of circumstances",
  society: "the systems we build and the people they shape",
  isolation: "characters cut off from the world, and themselves",
  peace: "the search for calm after conflict",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getGenreCopy(genre: string): CollectionCopy {
  const key = genre.toLowerCase();
  if (GENRE_COPY[key]) return GENRE_COPY[key];
  return {
    description: `Watch independent ${key} films online on WeCinema. Stream, discover and support ${key} filmmakers worldwide — free to watch.`,
    intro: `Browse independent ${key} films on WeCinema — uploaded by filmmakers you can support directly. Stream now, or buy and license titles in the marketplace.`,
    keywords: [`watch ${key} films online`, `indie ${key} movies`, `${key} streaming`],
  };
}

export function getRatingCopy(rating: string): CollectionCopy {
  return (
    RATING_COPY[rating] ?? {
      description: `Watch ${rating}-rated independent films online on WeCinema. Stream movies with a ${rating} content rating from filmmakers worldwide.`,
      intro: `Browse ${rating}-rated independent films on WeCinema, curated by content rating so you always know what you're watching.`,
      keywords: [`${rating} rated movies online`, `${rating} films streaming`],
    }
  );
}

export function getThemeCopy(slug: string): CollectionCopy {
  const key = slug.toLowerCase();
  const label = cap(key);
  const angle = THEME_ANGLE[key] ?? `stories built around ${key}`;
  return {
    description: `Watch independent films about ${key} on WeCinema — ${angle}. Stream ${key}-themed movies from filmmakers worldwide.`,
    intro: `The theme of ${label.toLowerCase()} runs through some of cinema's most memorable stories — ${angle}. Explore independent films exploring ${key} on WeCinema, from short films to features, made by creators you can support directly.`,
    keywords: [`films about ${key}`, `${key} themed movies`, `indie films ${key}`, `${key} short films`],
  };
}
