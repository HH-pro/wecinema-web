import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--color-accent-primary)",
            marginBottom: 8,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 9999,
            backgroundColor: "var(--color-accent-primary)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
