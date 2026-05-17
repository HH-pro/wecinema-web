import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { clientEnv } from "@/config/env";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
const TITLE = "WeCinema Terms & Conditions | Video Marketplace Policies";
const DESCRIPTION = "Read WeCinema Terms & Conditions covering video uploads, marketplace transactions, payments, licensing, and user responsibilities.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["WeCinema terms", "video marketplace policy", "content licensing", "video selling platform", "online video terms"],
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: {
    type: "website",
    title: "WeCinema Terms & Conditions",
    description: "Understand WeCinema platform rules for content creators, buyers, and sellers.",
    url: `${SITE}/terms-and-conditions`,
    images: [`${SITE}/seo/WeCinema.webp`],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeCinema Terms & Conditions",
    description: "Official terms for WeCinema video marketplace platform.",
    images: [`${SITE}/seo/WeCinema.webp`],
  },
};

const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const TOC = [
  { id: "account", label: "1. Account Registration" },
  { id: "content", label: "2. Content Upload & Licensing" },
  { id: "marketplace", label: "3. Marketplace Transactions" },
  { id: "payments", label: "4. Payments & Fees" },
  { id: "communication", label: "5. Communication System" },
  { id: "intellectual", label: "6. Intellectual Property" },
  { id: "termination", label: "7. Termination" },
  { id: "liability", label: "8. Liability & Disputes" },
];

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mt-8">
    <h2
      className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b-2"
      style={{ fontFamily: "var(--font-heading)", borderColor: "var(--color-divider)" }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[15px] font-semibold text-text-primary mt-5 mb-2">{children}</h4>
);

const P: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`text-sm text-text-secondary leading-[1.8] mb-2 ${className}`}>{children}</p>
);

const Ul: React.FC<{ children: React.ReactNode }> = ({ children }) => <ul className="pl-5 mb-3 list-disc">{children}</ul>;

const Li: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
  <li
    className="text-sm leading-[1.8] mb-1 pl-2"
    style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}
  >
    {children}
  </li>
);

export default function TermsPage() {
  return (
    <Layout>
      <div className="bg-bg-tertiary p-8">
        <div
          className="max-w-[860px] mx-auto bg-bg-elevated rounded-[20px] border border-border-secondary overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <header className="px-8 pt-10 pb-6 border-b border-divider text-center">
            <h1 className="text-[28px] font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              WeCinema Terms &amp; Conditions
            </h1>
            <p className="text-[13px] text-text-tertiary mt-1">Effective: {currentDate}</p>
            <p className="text-[13px] text-text-tertiary mt-0.5">Platform Agreement for Video Distribution &amp; Marketplace</p>
          </header>

          <div
            className="mx-8 mt-6 px-5 py-4 rounded-xl text-[13px] text-text-secondary leading-[1.7]"
            style={{
              backgroundColor: "var(--color-warning-bg)",
              border: "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
            }}
          >
            <strong>IMPORTANT:</strong> These Terms govern your use of WeCinema.co including video uploads, marketplace transactions, chat communications, and payment processing.
          </div>

          <div className="px-8 py-6 pb-10">
            {/* TOC */}
            <nav className="p-5 rounded-xl bg-bg-secondary border border-border-secondary mb-8">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Table of Contents</h3>
              {TOC.map((t) => (
                <a key={t.id} href={`#${t.id}`} className="block py-1.5 text-[13px] text-accent-primary transition-opacity hover:opacity-70">
                  {t.label}
                </a>
              ))}
            </nav>

            <Section id="account" title="1. Account Registration & User Responsibilities">
              <SubTitle>1.1 Account Creation</SubTitle>
              <P>To access WeCinema features, users must:</P>
              <Ul>
                {[
                  "Provide accurate registration information",
                  "Maintain account security and password confidentiality",
                  "Be at least 18 years old or have parental consent",
                  "Not create multiple accounts without authorization",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>1.2 User Types</SubTitle>
              <P>WeCinema supports three user roles:</P>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mt-3">
                {[
                  { title: "Content Creator", desc: "Uploads videos, retains ownership rights, can sell through marketplace" },
                  { title: "Buyer", desc: "Purchases video content, creates orders, uses chat for communication" },
                  { title: "Seller", desc: "Sells video listings, completes work, receives payments upon completion" },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h5 className="text-sm font-semibold text-accent-primary mb-1.5">{r.title}</h5>
                    <p className="text-[13px] text-text-tertiary leading-[1.5]">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="content" title="2. Content Upload & Licensing Terms">
              <SubTitle>2.1 Video Upload Requirements</SubTitle>
              <P>By uploading content to WeCinema, you warrant that:</P>
              <Ul>
                {[
                  "You own all rights or have necessary permissions",
                  "Content does not infringe third-party rights",
                  "Content complies with our Acceptable Use Policy",
                  "You grant WeCinema license to host and distribute",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>2.2 Hypemode Revenue</SubTitle>
              <div className="mt-3 p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                <span className="inline-block px-2.5 py-1 rounded-full bg-accent-primary text-white text-[11px] font-bold mb-2">🔥 Hypemode</span>
                <P className="font-semibold">Platform takes 15% of revenue</P>
                <P>Enhanced marketplace visibility and promotion including top search ranking, trending badge, push notifications, homepage featuring, and priority recommendations.</P>
              </div>
              <P className="mt-3">
                <strong>Note:</strong> Revenue percentages apply to net revenue after payment processing fees (Stripe: 2.9% + $0.30 per transaction).
              </P>
            </Section>

            <Section id="marketplace" title="3. Marketplace Transactions">
              <SubTitle>3.1 Listing Creation</SubTitle>
              <P>Sellers must:</P>
              <Ul>
                {[
                  "Provide accurate descriptions and pricing",
                  "Specify delivery timelines clearly",
                  "Disclose usage restrictions or licensing terms",
                  "Maintain availability of listed content",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>3.2 Order Process</SubTitle>
              <div className="flex flex-col gap-3 mt-3">
                {[
                  "Buyer selects listing and creates order",
                  "Payment processed via Stripe (held in escrow)",
                  "Seller completes work and delivers through platform",
                  "Buyer approves delivery, payment released to seller",
                ].map((t, i) => (
                  <div key={t} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-bg-secondary border border-border-secondary">
                    <span className="w-7 h-7 rounded-full bg-accent-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <p className="text-[13px] text-text-secondary leading-[1.5]">{t}</p>
                  </div>
                ))}
              </div>
              <SubTitle>3.3 Hypemode Listings</SubTitle>
              <Ul>
                {[
                  "Premium placement in search results",
                  "Special 'Trending' badge",
                  "Push notification alerts to buyers",
                  "Featured on homepage",
                  "Reduced 15% platform fee (vs 30% standard)",
                  "Included in weekly Featured Collections",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
            </Section>

            <Section id="payments" title="4. Payment Processing & Fees">
              <SubTitle>4.1 Stripe Integration</SubTitle>
              <Ul>
                {[
                  "All transactions processed through Stripe",
                  "Standard platform fee: 5% per transaction",
                  "Hypemode: 5% fee + 15% revenue share",
                  "Payment held in escrow until completion",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>4.2 Payment Release</SubTitle>
              <Ul>
                {[
                  "Buyer confirms work completion",
                  "48-hour dispute period passes",
                  "Platform fees deducted",
                  "Account meets $50 minimum payout",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>4.3 Dispute Resolution</SubTitle>
              <Ul>
                {[
                  "Platform mediates via chat history and evidence",
                  "Decision within 5 business days",
                  "Either party can appeal",
                  "Escrow funds distributed per resolution",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
            </Section>

            <Section id="communication" title="5. Communication & Chat System">
              <SubTitle>5.1 Chat Guidelines</SubTitle>
              <Ul>
                {[
                  "Keep communications professional and relevant",
                  "Don't share personal contact info before completion",
                  "Use chat for order discussions and delivery confirmations",
                  "All logs stored for dispute resolution",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>5.2 Prohibited Communications</SubTitle>
              <Ul>
                {[
                  "Harassment or abusive language",
                  "Attempting to bypass platform payments",
                  "Spamming or promotional messages",
                  "Sharing illegal or copyrighted material",
                ].map((t) => (
                  <Li key={t} danger>
                    {t}
                  </Li>
                ))}
              </Ul>
            </Section>

            <Section id="intellectual" title="6. Intellectual Property Rights">
              <SubTitle>6.1 Content Ownership</SubTitle>
              <Ul>
                {[
                  "Creators grant non-exclusive license for hosting/distribution",
                  "Marketplace sales transfer usage rights per listing",
                  "Platform may use thumbnails for promotion",
                  "Original ownership retained unless explicitly transferred",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>6.2 License Types</SubTitle>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mt-3">
                {[
                  { title: "Standard License", desc: "Personal use only, non-commercial" },
                  { title: "Commercial License", desc: "Business use, monetization allowed" },
                  { title: "Exclusive License", desc: "All rights transferred to buyer" },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h5 className="text-sm font-semibold text-accent-primary mb-1.5">{r.title}</h5>
                    <p className="text-[13px] text-text-tertiary leading-[1.5]">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="termination" title="7. Account Termination & Suspension">
              <SubTitle>7.1 User Termination</SubTitle>
              <Ul>
                {[
                  "Active orders must be completed first",
                  "Pending payments processed within 30 days",
                  "Content may remain for 90 days post-termination",
                  "Listings deactivated immediately",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>7.2 Platform Suspension</SubTitle>
              <Ul>
                {[
                  "Violation of terms",
                  "Fraudulent activity",
                  "Copyright infringement",
                  "Abusive chat behavior",
                  "Multiple unresolved disputes",
                ].map((t) => (
                  <Li key={t} danger>
                    {t}
                  </Li>
                ))}
              </Ul>
            </Section>

            <Section id="liability" title="8. Liability, Disputes & Legal">
              <SubTitle>8.1 Limitation of Liability</SubTitle>
              <Ul>
                {[
                  "Limited to fees paid in last 6 months",
                  "Direct damages up to $1000",
                  "Not responsible for user content disputes",
                  "Not liable for third-party processor issues",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
              <SubTitle>8.2 Updates to Terms</SubTitle>
              <Ul>
                {[
                  "30-day notice before changes",
                  "Continued use = acceptance",
                  "Major changes may require re-acceptance",
                  "Previous terms archived",
                ].map((t) => (
                  <Li key={t}>{t}</Li>
                ))}
              </Ul>
            </Section>

            <div className="mt-10 p-6 rounded-2xl bg-bg-secondary border border-border-secondary text-center">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Acceptance of Terms</h3>
              <P>By using WeCinema.co, you agree to be bound by these Terms &amp; Conditions.</P>
              <p className="text-[13px] text-text-tertiary mt-3">Last Updated: {currentDate} · Version 2.1 · Includes Hypemode Terms</p>
            </div>

            <div className="mt-6 p-5 rounded-xl bg-accent-primary text-center">
              <h4 className="text-base font-semibold text-white mb-2">Questions about these terms?</h4>
              <p className="text-[13px] text-white/85 leading-[1.6]">Contact: legal@wecinema.co | Support: support@wecinema.co</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
