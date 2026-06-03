import Link from "next/link";
import { FaXTwitter, FaInstagram, FaYoutube, FaFacebookF } from "react-icons/fa6";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "WeCinema",
    links: [
      { label: "About", href: "/about" },
      { label: "Explore Films", href: "/explore" },
      { label: "Scripts", href: "/scripts" },
      { label: "Marketplace", href: "/marketplace/browse" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help & Support", href: "/support" },
      { label: "Contact", href: "/support" },
      { label: "Report Content", href: "/report" },
    ],
  },
  {
    heading: "Creators",
    links: [
      { label: "Upload a Film", href: "/upload/video" },
      { label: "Upload a Script", href: "/upload/script" },
      { label: "Creator Guidelines", href: "/marketplace/guide" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Marketplace Policies", href: "/marketplace/resources" },
    ],
  },
];

const SOCIALS = [
  { label: "X (Twitter)", href: "https://twitter.com/wecinema", icon: <FaXTwitter size={16} /> },
  { label: "Instagram", href: "https://instagram.com/wecinema", icon: <FaInstagram size={16} /> },
  { label: "YouTube", href: "https://youtube.com/@wecinema", icon: <FaYoutube size={16} /> },
  { label: "Facebook", href: "https://facebook.com/wecinema", icon: <FaFacebookF size={16} /> },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        backgroundColor: "var(--color-nav-bg)",
        borderTop: "1px solid var(--color-divider)",
        color: "var(--color-text-secondary)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 28,
            marginBottom: 32,
          }}
        >
          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-primary)",
                }}
              >
                {col.heading}
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      style={{ fontSize: 13.5, color: "var(--color-text-tertiary)", textDecoration: "none" }}
                      className="hover:!text-[var(--color-accent-primary)] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            paddingTop: 20,
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
            © {year} All rights reserved by{" "}
            <a
              href="https://wecinema.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline underline-offset-2"
              style={{ color: "var(--color-accent-primary)" }}
            >
              wecinema.co
            </a>
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-secondary)",
                }}
                className="hover:!text-white hover:!bg-[var(--color-accent-primary)] hover:!border-[var(--color-accent-primary)] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
