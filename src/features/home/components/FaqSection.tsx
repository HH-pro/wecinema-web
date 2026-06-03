import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is WeCinema free to join?",
    a: "Yes. Creating an account, browsing the marketplace, watching free films, and listing your work is completely free. Sellers only pay a platform fee when a sale actually completes.",
  },
  {
    q: "How are payments protected?",
    a: "Every order is protected by Stripe escrow. Funds are authorized when the order is placed and only released to the seller after the buyer confirms delivery — so funds are never released prematurely.",
  },
  {
    q: "What can I sell?",
    a: "Finished films and video content, commercial and broadcast licensing, adaptation rights for remakes and sequels, or custom commissions to a buyer's brief — four marketplace models in one place.",
  },
  {
    q: "What is HypeMode?",
    a: "HypeMode is a premium tier that gives your listings a trending badge, priority placement in discovery, push notifications to buyers, and a reduced platform fee on HypeMode sales.",
  },
  {
    q: "Who is WeCinema for?",
    a: "Independent filmmakers, scriptwriters, actors, studios, and AI creators who want to monetize their work — and the production companies and studios looking to source films, scripts, licensing, or custom video.",
  },
] as const;

export function FaqSection() {
  return (
    <section
      style={{ padding: "44px 24px 48px", borderTop: "1px solid var(--color-divider)" }}
      aria-labelledby="faq-heading"
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent-primary)",
            }}
          >
            FAQ
          </span>
          <h2
            id="faq-heading"
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(1.5rem, 3.2vw, 2.1rem)",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Frequently asked questions
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group/faq"
              style={{
                borderRadius: 14,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-secondary)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  cursor: "pointer",
                  listStyle: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {f.q}
                <Plus
                  size={18}
                  className="shrink-0 transition-transform duration-200 group-open/faq:rotate-45"
                  style={{ color: "var(--color-accent-primary)" }}
                  aria-hidden
                />
              </summary>
              <p
                style={{
                  margin: 0,
                  padding: "0 18px 16px",
                  fontSize: 14,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
