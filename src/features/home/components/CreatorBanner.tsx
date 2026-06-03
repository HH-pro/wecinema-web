import Link from "next/link";
import { Film, FileText } from "lucide-react";

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
};

export function CreatorBanner() {
  return (
    <section style={{ padding: "16px 24px 36px" }} aria-labelledby="creator-banner-heading">
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          padding: "clamp(32px, 6vw, 56px)",
          textAlign: "center",
          background:
            "linear-gradient(120deg, #1a1209 0%, #2a1c0d 45%, #1a1209 100%)",
          border: "1px solid rgba(255,107,0,0.25)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 120% at 50% 0%, rgba(255,107,0,0.22) 0%, transparent 70%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <h2
            id="creator-banner-heading"
            style={{
              margin: 0,
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: "#fff",
              letterSpacing: "-0.025em",
              maxWidth: 720,
            }}
          >
            Have a Film or Script? Start Earning Today.
          </h2>
          <p style={{ margin: 0, fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "rgba(255,255,255,0.78)", maxWidth: 560 }}>
            Upload original content, build an audience, and monetize your creativity.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
            <Link
              href="/upload/video"
              style={{ ...btn, background: "var(--color-accent-primary)", color: "#fff", boxShadow: "0 6px 20px rgba(255,107,0,0.4)" }}
              className="hover:!brightness-110"
            >
              <Film size={17} /> Upload Film
            </Link>
            <Link
              href="/upload/script"
              style={{ ...btn, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
              className="hover:!bg-white/20"
            >
              <FileText size={17} /> Upload Script
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
