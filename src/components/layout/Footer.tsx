"use client";

export default function Footer() {
  return (
    <footer
      className="w-full text-center py-4 text-xs tracking-wide"
      style={{
        backgroundColor: "var(--color-nav-bg)",
        borderTop: "1px solid var(--color-divider)",
        color: "var(--color-text-tertiary)",
      }}
    >
      © {new Date().getFullYear()} All rights reserved by{" "}
      <a
        href="https://wecinema.co"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline underline-offset-2"
        style={{ color: "var(--color-accent-primary)" }}
      >
        wecinema.co
      </a>
    </footer>
  );
}
