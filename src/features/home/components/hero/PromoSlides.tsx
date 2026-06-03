import Link from "next/link";
import { Play, Clapperboard, ShoppingBag, Upload, Sparkles, Star, Eye } from "lucide-react";
import { resolveThumb } from "@/features/home/lib/posterFallback";

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
  background: "var(--color-accent-primary,#FF6B00)",
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
  const poster = resolveThumb(film.image);
  return (
    <div style={{ ...slideBase, justifyContent: "flex-end" }}>
      {/* Fixed cinematic backdrop with slow Ken Burns zoom. Rendered as a CSS
          background so the image file type is irrelevant (SVG now, .webp later). */}
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
      {/* Legibility gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(8,6,5,0.94) 0%, rgba(8,6,5,0.74) 38%, rgba(8,6,5,0.12) 100%), linear-gradient(0deg, rgba(8,6,5,0.9) 0%, transparent 58%)",
        }}
      />
      {/* Warm accent glow behind the title for depth */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-5%",
          top: "26%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,0,0.30) 0%, rgba(255,107,0,0) 68%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating featured-film poster card (desktop) */}
      <div
        aria-hidden
        className="max-lg:hidden"
        style={{ position: "absolute", right: "clamp(48px, 6vw, 104px)", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}
      >
        {/* glow halo */}
        <div
          style={{
            position: "absolute",
            inset: -26,
            borderRadius: 28,
            background: "radial-gradient(circle at 50% 40%, rgba(255,107,0,0.45), rgba(255,107,0,0) 70%)",
            filter: "blur(10px)",
          }}
        />
        <div
          className="hero-poster-float"
          style={{
            position: "relative",
            width: "clamp(190px, 16vw, 240px)",
            aspectRatio: "2/3",
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: "#1a120c",
            backgroundImage: `url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 30px 70px rgba(0,0,0,0.62), inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {/* sheen + play badge */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, transparent 36%, transparent 70%, rgba(0,0,0,0.45) 100%)" }} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(255,107,0,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(255,107,0,0.5)",
            }}
          >
            <Play size={22} fill="#fff" color="#fff" />
          </div>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 640, display: "flex", flexDirection: "column", gap: 14, zIndex: 2 }}>
        {film.redCarpet && (
          <span className="hero-rise hero-rise-1" style={{ ...eyebrow("linear-gradient(135deg,#E11D48,#FF6B00)", "#fff") }}>
            <Sparkles size={12} /> Red Carpet Premiere
          </span>
        )}
        <h2
          className="hero-rise hero-rise-2"
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5.5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.04,
            color: "#fff",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 24px rgba(0,0,0,0.55)",
          }}
        >
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
          <p
            className="line-clamp-2 hero-rise hero-rise-3"
            style={{ margin: 0, fontSize: "clamp(0.92rem, 2vw, 1.08rem)", color: "rgba(255,255,255,0.84)", maxWidth: 560, lineHeight: 1.55 }}
          >
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
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
        <span style={eyebrow("rgba(56,189,248,0.18)", "#7dd3fc")}>
          <ShoppingBag size={12} /> Marketplace
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(1.9rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.06,
            color: "#fff",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.025em",
          }}
        >
          Sell Your Film &amp; Get Paid
        </h2>
        <p style={{ margin: 0, fontSize: "clamp(0.92rem, 2vw, 1.08rem)", color: "rgba(255,255,255,0.82)", maxWidth: 540, lineHeight: 1.55 }}>
          List finished films, license rights, or take commissions. Stripe escrow releases funds
          only on confirmed delivery — keep more of every sale.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
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
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
        <span style={eyebrow("rgba(255,107,0,0.2)", "var(--color-accent-primary,#FF6B00)")}>
          <Upload size={12} /> For Creators
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(1.9rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.06,
            color: "#fff",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.025em",
          }}
        >
          Upload Original Films &amp; Scripts
        </h2>
        <p style={{ margin: 0, fontSize: "clamp(0.92rem, 2vw, 1.08rem)", color: "rgba(255,255,255,0.82)", maxWidth: 540, lineHeight: 1.55 }}>
          Publish your work, build an audience, and turn creativity into currency through streaming
          and marketplace sales.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
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
