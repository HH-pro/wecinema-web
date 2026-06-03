import { Play, Upload, DollarSign } from "lucide-react";

const STEPS = [
  {
    n: 1,
    icon: <Play size={22} />,
    title: "Watch",
    desc: "Explore independent films from creators worldwide.",
  },
  {
    n: 2,
    icon: <Upload size={22} />,
    title: "Upload",
    desc: "Publish your films and scripts.",
  },
  {
    n: 3,
    icon: <DollarSign size={22} />,
    title: "Earn",
    desc: "Generate revenue through streaming and marketplace sales.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      style={{ padding: "32px 24px 48px", borderTop: "1px solid var(--color-divider)" }}
      aria-labelledby="how-it-works-heading"
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2
          id="how-it-works-heading"
          style={{
            margin: 0,
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 800,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          How WeCinema Works
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--color-text-secondary)" }}>
          Three steps from watching to earning.
        </p>
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: "0 auto",
          padding: 0,
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {STEPS.map((s) => (
          <li
            key={s.n}
            style={{
              position: "relative",
              padding: "28px 24px",
              borderRadius: 16,
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-secondary)",
              textAlign: "center",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 14,
                right: 18,
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1,
                color: "var(--color-accent-primary)",
                opacity: 0.16,
                fontFamily: "var(--font-heading)",
              }}
            >
              {s.n}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 14,
                marginBottom: 14,
                background: "linear-gradient(135deg, var(--color-accent-primary,#FF6B00), #E6B450)",
                color: "#fff",
              }}
            >
              {s.icon}
            </span>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {s.title}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
