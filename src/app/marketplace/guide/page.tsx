"use client";

import React from "react";
import Link from "next/link";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_ORIGIN } from "@/lib/seo";

const STEPS = [
  {
    title: "Create your seller account",
    body: (
      <>
        Sign up and choose the seller role, then connect a Stripe account so you can get paid. WeCinema
        uses Stripe escrow, which means buyer funds are held securely and only released to you once a
        sale is confirmed. <Link href="/signup">Create your account</Link> to begin.
      </>
    ),
  },
  {
    title: "Create a listing",
    body: (
      <>
        Head to <Link href="/marketplace/listings/new">New Listing</Link> and add your film or script.
        Pick a listing type — <strong>for sale</strong>, <strong>licensing</strong>,{" "}
        <strong>adaptation rights</strong>, or <strong>commission</strong> — then upload a poster,
        write a clear description, and set your price.
      </>
    ),
  },
  {
    title: "Get approved & go live",
    body: (
      <>
        New listings pass a quick review to keep the marketplace high-quality. Once approved your listing
        goes live and becomes discoverable in <Link href="/marketplace/browse">Browse Listings</Link> and
        across search.
      </>
    ),
  },
  {
    title: "Negotiate offers & chat with buyers",
    body: (
      <>
        Buyers can purchase outright or send an offer. Use built-in chat to answer questions, agree on
        terms, and close the deal — all inside WeCinema.
      </>
    ),
  },
  {
    title: "Deliver & get paid",
    body: (
      <>
        After the buyer confirms delivery, Stripe escrow releases your earnings (minus the platform fee)
        straight to your connected account. Track everything from your{" "}
        <Link href="/marketplace/dashboard/seller">seller dashboard</Link>.
      </>
    ),
  },
];

const FAQ = [
  {
    q: "How much does it cost to sell on WeCinema?",
    a: "Creating an account and listing your work is free. WeCinema takes a platform fee only when you make a sale; the rest is transferred to your connected Stripe account.",
  },
  {
    q: "How do I get paid?",
    a: "Payments run through Stripe escrow. Buyer funds are authorized at purchase and released to your Stripe account once the order is marked delivered, so both sides are protected.",
  },
  {
    q: "What can I sell?",
    a: "Finished films, licensing and adaptation rights, and commissioned work. You can also publish scripts and screenplays for sale or collaboration.",
  },
  {
    q: "How long does listing approval take?",
    a: "Most listings are reviewed quickly. You'll be notified the moment your listing is approved and goes live.",
  },
];

const Guide: React.FC = () => {
  return (
    <MarketplaceLayout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Sell Your Film or Script on WeCinema",
          description:
            "A step-by-step guide to listing and selling independent films, licensing rights, and scripts on the WeCinema marketplace.",
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            url: `${SITE_ORIGIN}/marketplace/guide#step-${i + 1}`,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px clamp(16px, 4vw, 24px) 64px" }}>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumbs items={[{ name: "Marketplace", href: "/marketplace" }, { name: "Seller Guide" }]} />
        </div>

        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 800, margin: "0 0 12px", fontFamily: "var(--font-poppins)" }}>
          Seller Guide: How to Sell Your Film &amp; Scripts on WeCinema
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--color-text-secondary)", margin: "0 0 8px", maxWidth: 720 }}>
          WeCinema lets independent filmmakers and writers sell finished films, license rights, take
          commissions, and publish scripts to a global audience — with secure Stripe escrow payments.
          This guide walks you through everything from your first listing to getting paid.
        </p>

        <section aria-label="Steps to sell" style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} id={`step-${i + 1}`} style={{ display: "flex", gap: 16 }}>
              <div
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  background: "var(--color-accent-primary)",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 6px" }}>{s.title}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--color-text-secondary)", margin: 0 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section aria-label="Frequently asked questions" style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px", fontFamily: "var(--font-poppins)" }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ.map((f) => (
              <div key={f.q} style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{f.q}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/marketplace/listings/new"
            style={{ padding: "12px 22px", borderRadius: 12, background: "var(--color-accent-primary)", color: "#000", fontWeight: 700, textDecoration: "none" }}
          >
            List your film
          </Link>
          <Link
            href="/marketplace/resources"
            style={{ padding: "12px 22px", borderRadius: 12, border: "1px solid var(--color-divider)", color: "var(--color-text-secondary)", fontWeight: 600, textDecoration: "none" }}
          >
            Seller resources
          </Link>
          <Link
            href="/support"
            style={{ padding: "12px 22px", borderRadius: 12, border: "1px solid var(--color-divider)", color: "var(--color-text-secondary)", fontWeight: 600, textDecoration: "none" }}
          >
            Get support
          </Link>
        </section>
      </div>
    </MarketplaceLayout>
  );
};

export default Guide;
