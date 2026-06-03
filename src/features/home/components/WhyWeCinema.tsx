import {
  Wallet,
  ShieldCheck,
  Repeat,
  Clapperboard,
  ShoppingBag,
  Globe,
  Handshake,
} from "lucide-react";

const PILLARS = [
  {
    icon: <Wallet size={22} />,
    title: "Creator-to-buyer, no middlemen",
    desc: "Set your own price and sell directly to a global audience of buyers. Keep more of every sale.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Escrow on every order",
    desc: "Stripe holds funds until delivery is confirmed — buyers purchase with zero risk, sellers get paid for confirmed work.",
  },
  {
    icon: <Repeat size={22} />,
    title: "Four ways to monetize",
    desc: "Sell finished films, license rights, sell adaptation rights, or take custom commissions — every model, one platform.",
  },
  {
    icon: <Clapperboard size={22} />,
    title: "Built for filmmakers",
    desc: "4K uploads, adaptive streaming, order-linked chat, and an AI assistant trained for film. Made by people who get the craft.",
  },
] as const;

const MODELS = [
  { icon: <ShoppingBag size={18} />, title: "For Sale", desc: "Direct purchase of finished films." },
  { icon: <Globe size={18} />, title: "Licensing", desc: "Broadcast & digital distribution rights." },
  { icon: <Repeat size={18} />, title: "Adaptation Rights", desc: "Remakes, sequels & derivative works." },
  { icon: <Handshake size={18} />, title: "Commission", desc: "Custom work to a buyer's brief." },
] as const;

export function WhyWeCinema() {
  return (
    <section
      style={{ padding: "40px 24px 8px", borderTop: "1px solid var(--color-divider)" }}
      aria-labelledby="why-heading"
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28, maxWidth: 640, marginInline: "auto" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent-primary)",
            }}
          >
            Why WeCinema
          </span>
          <h2
            id="why-heading"
            style={{
              margin: "8px 0 8px",
              fontSize: "clamp(1.5rem, 3.2vw, 2.1rem)",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            The home for independent film — watch, create, and trade
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            WeCinema brings streaming and a creator marketplace together: discover films from creators
            worldwide, and sell, license, or commission work with secure, escrow-protected payments.
          </p>
        </div>

        {/* Pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {PILLARS.map((p) => (
            <div
              key={p.title}
              style={{
                padding: "22px 20px",
                borderRadius: 16,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-secondary)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  marginBottom: 14,
                  background: "linear-gradient(135deg, var(--color-accent-primary,#FF6B00), #E6B450)",
                  color: "#fff",
                }}
              >
                {p.icon}
              </span>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-heading)",
                  lineHeight: 1.3,
                }}
              >
                {p.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Marketplace models strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          {MODELS.map((m) => (
            <div
              key={m.title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                backgroundColor: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border-secondary)",
              }}
            >
              <span style={{ color: "var(--color-accent-primary)", marginTop: 1, flexShrink: 0 }}>{m.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {m.title}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
