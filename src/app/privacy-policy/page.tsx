import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How WeCinema collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy-policy" },
};

const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const nextReview = new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const Section: React.FC<{ id?: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mt-7 p-5 rounded-xl border border-border-secondary bg-bg-elevated">
    <h2
      className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b-2"
      style={{ fontFamily: "var(--font-heading)", borderColor: "var(--color-divider)" }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[15px] text-text-secondary leading-[1.8] my-2">{children}</p>
);

const Ul: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="pl-5 my-3 list-disc">{children}</ul>
);

const Li: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
  <li
    className="text-[15px] leading-[1.8] mb-1.5 pl-2"
    style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}
  >
    {children}
  </li>
);

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="bg-bg-tertiary p-8">
        <div
          className="max-w-[860px] mx-auto bg-bg-elevated rounded-[20px] border border-border-secondary overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))" }} />

          <header className="px-8 pt-10 pb-6 text-center border-b border-divider bg-bg-secondary">
            <h1 className="text-[28px] font-bold text-accent-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Privacy Policy
            </h1>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-lg text-[13px] bg-bg-elevated text-text-tertiary" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                Effective: {currentDate}
              </span>
              <span className="px-3.5 py-1.5 rounded-lg text-[13px] bg-bg-elevated text-text-tertiary" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                WeCinema Video Platform
              </span>
            </div>
          </header>

          <div className="px-8 py-8 leading-[1.8] text-text-secondary">
            <div
              className="px-5 py-4 rounded-xl text-sm mb-6"
              style={{
                backgroundColor: "var(--color-warning-bg)",
                borderLeft: "4px solid var(--color-warning)",
              }}
            >
              <strong>IMPORTANT:</strong> This Privacy Policy explains how WeCinema collects, uses, and protects your personal information.
            </div>

            <Section title="1. Overview & Scope">
              <P>Your privacy is important to us. This policy applies to all WeCinema users — Content Creators, Buyers, and Sellers.</P>
            </Section>

            <Section title="2. Information We Collect">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 my-4">
                {[
                  { t: "Account Information", d: "Name, email, password, and profile information.", accent: false },
                  { t: "Payment Information", d: "Payment details via Stripe for transactions and revenue sharing.", accent: true },
                  { t: "Content Information", d: "Video metadata including titles, descriptions, and usage rights.", accent: false },
                  { t: "Usage Data", d: "Pages visited, videos watched, and marketplace activities.", accent: false },
                ].map((c) => (
                  <div
                    key={c.t}
                    className="p-4 rounded-xl transition-transform"
                    style={
                      c.accent
                        ? {
                            border: "2px solid var(--color-accent-primary)",
                            backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 5%, transparent)",
                          }
                        : {
                            border: "1px solid var(--color-border-secondary)",
                            backgroundColor: "var(--color-bg-secondary)",
                          }
                    }
                  >
                    <h4
                      className="text-[15px] font-semibold mb-1.5"
                      style={{ color: c.accent ? "var(--color-accent-primary)" : "var(--color-text-primary)" }}
                    >
                      {c.t}
                    </h4>
                    <P>{c.d}</P>
                  </div>
                ))}
              </div>
              <h3
                className="text-base font-semibold text-text-primary mt-5 mb-2 pl-3"
                style={{ borderLeft: "3px solid var(--color-divider)" }}
              >
                2.1 Automatic Data Collection
              </h3>
              <Ul>
                {[
                  "Cookies: Small data files stored to enhance experience",
                  "Log Files: IP address, browser type, timestamps",
                  "Web Beacons: Track browsing behavior",
                  "Analytics Tools: Google Analytics and similar",
                ].map((t) => (
                  <Li key={t}>
                    <span
                      className="px-1.5 py-0.5 rounded text-accent-primary font-semibold text-sm"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
                    >
                      {t.split(":")[0]}:
                    </span>
                    {t.split(":")[1]}
                  </Li>
                ))}
              </Ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <Ul>
                {[
                  { h: "Service Provision", items: ["Hosting and streaming video content", "Processing marketplace transactions", "Facilitating buyer-seller communications"] },
                  { h: "Business Operations", items: ["Calculating revenue shares", "Monitoring for fraud", "Resolving disputes"] },
                  { h: "Personalization", items: ["Recommending relevant videos", "Suggesting marketplace listings", "Customizing dashboard"] },
                  { h: "Communication", items: ["Order status notifications", "Revenue payment confirmations", "Platform announcements"] },
                ].map((g) => (
                  <Li key={g.h}>
                    <strong>{g.h}:</strong>
                    <ul className="pl-5 mt-1 list-disc">
                      {g.items.map((i) => (
                        <li key={i} className="text-sm text-text-tertiary leading-[1.7] mb-1 pl-3">
                          {i}
                        </li>
                      ))}
                    </ul>
                  </Li>
                ))}
              </Ul>
            </Section>

            <Section title="4. Information Sharing">
              <P>We do not sell your personal information. Sharing occurs with:</P>
              <Ul>
                <Li><strong>Service Providers:</strong> Stripe (payments), AWS (hosting), email services</Li>
                <Li><strong>Legal Requirements:</strong> When required by law</Li>
                <Li><strong>Business Transfers:</strong> During mergers or acquisitions</Li>
                <Li><strong>With Your Consent:</strong> When you explicitly authorize</Li>
              </Ul>
              <div
                className="px-5 py-4 rounded-xl text-sm my-4"
                style={{
                  backgroundColor: "var(--color-info-bg)",
                  borderLeft: "4px solid var(--color-info)",
                }}
              >
                <strong>Note:</strong> Transaction details (excluding payment info) may be visible to other marketplace users.
              </div>
            </Section>

            <Section title="5. Data Security">
              <Ul>
                {[
                  "SSL/TLS encryption during transmission",
                  "Secure password hashing",
                  "Regular security audits",
                  "Access controls and authentication",
                  "PCI-compliant payment processing",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
            </Section>

            <Section title="6. Your Rights & Choices">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 my-4">
                {[
                  { icon: "👁️", title: "Access", desc: "Access your personal data" },
                  { icon: "✏️", title: "Correction", desc: "Correct inaccurate data" },
                  { icon: "🗑️", title: "Deletion", desc: "Request data deletion" },
                  { icon: "⛔", title: "Opt-Out", desc: "Opt-out of marketing" },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl text-center bg-bg-secondary border border-border-secondary">
                    <span className="text-2xl block mb-2">{r.icon}</span>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">{r.title}</h4>
                    <p className="text-[13px] text-text-tertiary">{r.desc}</p>
                  </div>
                ))}
              </div>
              <P>Contact privacy@wecinema.co to exercise these rights.</P>
            </Section>

            <Section title="7. Cookies & Tracking">
              <Ul>
                {[
                  "Essential Cookies: Required for login and transactions",
                  "Performance Cookies: Understanding user interactions",
                  "Functionality Cookies: Remember preferences",
                  "Advertising Cookies: Deliver relevant ads",
                ].map((t) => (
                  <Li key={t}>
                    <strong>{t.split(":")[0]}:</strong>{t.split(":")[1]}
                  </Li>
                ))}
              </Ul>
            </Section>

            <Section title="8. International Data Transfers">
              <P>Your information may be transferred to and maintained on servers outside your jurisdiction. By using WeCinema, you consent to such transfers.</P>
            </Section>

            <Section title="9. Children's Privacy">
              <P>WeCinema is not intended for users under 18. We do not knowingly collect personal information from children.</P>
            </Section>

            <div
              className="mt-7 p-8 rounded-2xl text-white text-center"
              style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
            >
              <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
              <p className="text-sm opacity-90">Email: privacy@wecinema.co · Support: support@wecinema.co</p>
            </div>

            <div className="mt-7 p-6 rounded-xl text-center border-2 border-dashed border-border-secondary bg-bg-secondary">
              <h3 className="text-base font-semibold text-text-primary mb-2">Updates to This Policy</h3>
              <p className="text-[13px] text-text-tertiary">We may update this policy periodically.</p>
              <div className="flex justify-center gap-4 mt-3 flex-wrap">
                {[
                  { label: "Last Updated", val: currentDate },
                  { label: "Version", val: "2.0" },
                  { label: "Next Review", val: nextReview },
                ].map((item) => (
                  <div key={item.label} className="bg-bg-elevated px-5 py-3 rounded-lg min-w-[120px] text-[13px] text-text-secondary">
                    <strong className="block text-text-primary">{item.label}</strong>
                    {item.val}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
