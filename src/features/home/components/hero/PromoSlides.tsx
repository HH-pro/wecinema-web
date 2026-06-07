import Link from "next/link";
import Image from "next/image";
import { Play, Clapperboard, ShoppingBag, Upload, Sparkles, Star, Eye } from "lucide-react";
/**
 * Fixed cinematic backdrop for the first hero slide. Swap this path for your own
 * photo (e.g. "/hero-bg.webp") — any image file under /public works as-is.
 */
const HERO_BG_IMAGE = "/hero-bg.svg";

export interface HeroFeatured {
  id: string;
  title: string;
  tagline?: string;
  href: string;
  image: string;
  /** Playable (signed) video URL shown as a preview on the right of the hero. */
  video?: string;
  redCarpet: boolean;
  genre?: string;
  rating?: string;
  views?: number;
}

function formatViews(n?: number): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

// ── shared button styles ──────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  background: "var(--color-accent-primary,#FFBB00)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
  boxShadow: "0 8px 24px rgba(255,107,0,0.4)",
};
const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.28)",
  backdropFilter: "blur(6px)",
};

const slideBase: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 16,
  padding: "32px clamp(20px, 5vw, 64px)",
  overflow: "hidden",
};

const eyebrow = (bg: string, color: string): React.CSSProperties => ({
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 12px",
  borderRadius: 9999,
  background: bg,
  color,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
});

// ── Poster-collage backdrop (real film thumbnails, blurred & dimmed) ──
function PosterCollage({ images, tint }: { images: string[]; tint: string }) {
  const tiles = images.slice(0, 12);
  if (tiles.length === 0) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-8%",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8,
          filter: "blur(2px) saturate(1.05)",
          opacity: 0.5,
          transform: "rotate(-4deg) scale(1.18)",
        }}
      >
        {tiles.concat(tiles).slice(0, 12).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 8 }}
          />
        ))}
      </div>
      {/* tint + legibility wash */}
      <div style={{ position: "absolute", inset: 0, background: tint }} />
    </div>
  );
}

// ── Slide 1: Featured Red Carpet Film ─────────────────────────
export function FeaturedFilmSlide({ film }: { film: HeroFeatured }) {
  const views = formatViews(film.views);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Base cinematic ambiance backdrop (also the fallback when no video). */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          className="hero-kenburns"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_BG_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Mobile / tablet: an OPTIMIZED poster image (next/image, priority) as the
          full-bleed backdrop — deliberately NOT an autoplay video, so we protect
          LCP and don't burn mobile data on a video the user may never watch. */}
      {film.image && (
        <div aria-hidden className="absolute inset-0 overflow-hidden lg:hidden">
          <Image
            src={film.image}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <span
            aria-hidden
            style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.32) 0%, transparent 44%)" }}
          />
        </div>
      )}

      {/* Desktop (lg+): the live film as a floating rounded card on the right.
          Autoplay video is reserved for larger screens where bandwidth and the
          layout both allow it; the poster shows until the first frame is ready. */}
      {film.video && (
        <div
          aria-hidden
          className="absolute overflow-hidden hidden lg:block lg:inset-y-8 lg:left-auto lg:right-[clamp(20px,4vw,56px)] lg:w-[44%] lg:rounded-2xl lg:border lg:border-white/15 lg:shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
        >
          <video
            src={film.video}
            poster={film.image}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <span
            aria-hidden
            style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.32) 0%, transparent 44%)" }}
          />
        </div>
      )}

      {/* Legibility overlays — mobile darkens the bottom over the full-bleed
          video; desktop paints a dark left panel fading toward the video card. */}
      <div
        aria-hidden
        className="lg:hidden"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(8,6,5,0.95) 0%, rgba(8,6,5,0.62) 44%, rgba(8,6,5,0.28) 100%)",
        }}
      />
      <div
        aria-hidden
        className="hidden lg:block"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(8,6,5,0.96) 0%, rgba(8,6,5,0.86) 38%, rgba(8,6,5,0.45) 52%, transparent 66%)",
        }}
      />

      <div
        className="relative z-[2] flex h-full flex-col justify-end lg:justify-center max-w-[640px] lg:max-w-[50%]"
        style={{ gap: 14, padding: "32px clamp(20px, 5vw, 64px)" }}
      >
        {film.redCarpet && (
          <span className="hero-rise hero-rise-1" style={{ ...eyebrow("linear-gradient(135deg,#E11D48,#FFBB00)", "#fff") }}>
            <Sparkles size={12} /> Red Carpet Premiere
          </span>
        )}
        <h2 className="hero-rise hero-rise-2" style={slideHeading}>
          {film.title}
        </h2>

        {/* Meta chips */}
        {(film.genre || film.rating || views) && (
          <div className="hero-rise hero-rise-3" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {film.genre && (
              <span style={metaChip}>{film.genre}</span>
            )}
            {film.rating && (
              <span style={{ ...metaChip, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Star size={11} fill="currentColor" /> {film.rating}
              </span>
            )}
            {views && (
              <span style={{ ...metaChip, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Eye size={12} /> {views}
              </span>
            )}
          </div>
        )}

        {film.tagline && (
          <p className="line-clamp-2 hero-rise hero-rise-3" style={slideSubtext}>
            {film.tagline}
          </p>
        )}
        <div className="hero-rise hero-rise-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
          <Link href={film.href} style={primaryBtn} className="hover:!brightness-110">
            <Play size={16} fill="currentColor" /> Watch Now
          </Link>
          <Link href="/explore" style={ghostBtn} className="hover:!bg-white/20">
            <Clapperboard size={16} /> Browse Films
          </Link>
        </div>
      </div>
    </div>
  );
}

const metaChip: React.CSSProperties = {
  padding: "4px 11px",
  borderRadius: 9999,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  backdropFilter: "blur(4px)",
};

// ── Shared slide typography so all three slides align identically ──
const slideHeading: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.9rem, 4.8vw, 3rem)",
  fontWeight: 800,
  lineHeight: 1.05,
  color: "#fff",
  fontFamily: "var(--font-heading)",
  letterSpacing: "-0.03em",
  textShadow: "0 2px 24px rgba(0,0,0,0.45)",
};
const slideSubtext: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(0.92rem, 2vw, 1.08rem)",
  color: "rgba(255,255,255,0.84)",
  maxWidth: 540,
  lineHeight: 1.55,
};
/** Shared content column: same width, alignment & vertical centering on every slide. */
const slideContentClass =
  "relative z-[2] flex h-full flex-col justify-center gap-3.5 max-w-[640px] lg:max-w-[600px]";

// ── Slide 2: Marketplace promotion ────────────────────────────
export function MarketplaceSlide({ posters = [] }: { posters?: string[] }) {
  return (
    <div
      style={{
        ...slideBase,
        background: "radial-gradient(120% 140% at 100% 0%, #14304a 0%, #122033 55%, #0c1118 100%)",
      }}
    >
      <PosterCollage
        images={posters}
        tint="linear-gradient(90deg, rgba(12,17,24,0.95) 0%, rgba(18,32,51,0.78) 45%, rgba(20,48,74,0.55) 100%)"
      />
      <div className={slideContentClass}>
        <span className="hero-rise hero-rise-1" style={eyebrow("rgba(56,189,248,0.18)", "#7dd3fc")}>
          <ShoppingBag size={12} /> Marketplace
        </span>
        <h2 className="hero-rise hero-rise-2" style={slideHeading}>
          Sell Your Film &amp; Get Paid
        </h2>
        <p className="hero-rise hero-rise-3" style={slideSubtext}>
          List finished films, license rights, or take commissions. Stripe escrow releases funds
          only on confirmed delivery — keep more of every sale.
        </p>
        <div className="hero-rise hero-rise-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
          <Link href="/marketplace/listings/new" style={primaryBtn} className="hover:!brightness-110">
            <ShoppingBag size={16} /> List Your Film
          </Link>
          <Link href="/marketplace/browse" style={ghostBtn} className="hover:!bg-white/20">
            Browse Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Slide 3: Creator promotion ────────────────────────────────
export function CreatorSlide({ posters = [] }: { posters?: string[] }) {
  return (
    <div
      style={{
        ...slideBase,
        background: "radial-gradient(120% 140% at 0% 100%, #3a2a12 0%, #2a1d10 55%, #120d0a 100%)",
      }}
    >
      <PosterCollage
        images={posters}
        tint="linear-gradient(90deg, rgba(18,13,10,0.95) 0%, rgba(42,29,16,0.78) 45%, rgba(58,42,18,0.5) 100%)"
      />
      <div className={slideContentClass}>
        <span className="hero-rise hero-rise-1" style={eyebrow("rgba(255,107,0,0.2)", "var(--color-accent-primary,#FFBB00)")}>
          <Upload size={12} /> For Creators
        </span>
        <h2 className="hero-rise hero-rise-2" style={slideHeading}>
          Upload Original Films &amp; Scripts
        </h2>
        <p className="hero-rise hero-rise-3" style={slideSubtext}>
          Publish your work, build an audience, and turn creativity into currency through streaming
          and marketplace sales.
        </p>
        <div className="hero-rise hero-rise-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
          <Link href="/upload/video" style={primaryBtn} className="hover:!brightness-110">
            <Upload size={16} /> Start Earning
          </Link>
          <Link href="/upload/script" style={ghostBtn} className="hover:!bg-white/20">
            Upload a Script
          </Link>
        </div>
      </div>
    </div>
  );
}
