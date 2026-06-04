"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

/**
 * Public marketplace surfaces that stay accessible even without an active
 * subscription — the marketing landing and the informational guide/resources.
 * Everything else under /marketplace requires an active subscription.
 */
function isPublicMarketplacePath(pathname: string): boolean {
  return (
    pathname === "/marketplace" ||
    pathname.startsWith("/marketplace/guide") ||
    pathname.startsWith("/marketplace/resources")
  );
}

/**
 * Gates the marketplace app routes behind an active subscription. When a logged
 * in user's subscription has expired (hasPaid === false), the marketplace pages
 * are replaced with a renew prompt instead of the feature. Logged-out visitors
 * and the public marketing pages are unaffected (acquisition flows stay open).
 */
export function MarketplaceAccessGuard({ children }: { children: React.ReactNode }) {
  const { authUser, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  const blocked =
    !isLoading &&
    isAuthenticated &&
    !authUser?.hasPaid &&
    !isPublicMarketplacePath(pathname);

  if (!blocked) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          padding: "36px 28px",
          borderRadius: 16,
          border: "1px solid var(--color-card-border)",
          background: "var(--color-card-bg)",
          boxShadow: "0 12px 40px var(--color-shadow)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 18px",
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--accent-soft)",
            color: "var(--color-accent-primary)",
          }}
        >
          <Lock size={24} />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "1.4rem",
            fontWeight: 800,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          Subscription expired
        </h1>
        <p style={{ margin: "0 0 22px", fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
          Your subscription has ended, so marketplace features are paused. Renew
          to list films, make offers, manage orders, and chat with buyers and
          sellers again.
        </p>
        <Link
          href="/explore"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            background: "var(--color-accent-primary)",
            color: "#000",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
          className="hover:!brightness-110"
        >
          Renew Subscription
        </Link>
      </div>
    </div>
  );
}
