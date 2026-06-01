"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { IoMdHome } from "react-icons/io";
import { RiMovie2Line } from "react-icons/ri";
import { MdChatBubbleOutline, MdMenu } from "react-icons/md";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W } from "@/lib/constants";

const BOTTOM_NAV_H = 58;

interface LayoutProps {
  children: ReactNode;
  hasHeader?: boolean;
}

function BottomNavItem({
  href, icon, label, active,
}: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 3, flex: 1, padding: "6px 4px", textDecoration: "none",
        color: active ? "var(--color-accent-primary)" : "var(--color-text-tertiary)",
        transition: "color 0.15s",
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>{label}</span>
    </Link>
  );
}

export default function Layout({ children, hasHeader = true }: LayoutProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  // Track only the breakpoint booleans (not the raw width) so resizing doesn't
  // re-render the whole tree + Framer Motion on every pixel — only when a
  // threshold is actually crossed. Defaults to desktop to match SSR output.
  const [bp, setBp] = useState({ tabletOrMobile: false, mobile: false });

  useIsomorphicLayoutEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const next = { tabletOrMobile: w <= 1120, mobile: w <= 768 };
      setBp((prev) =>
        prev.tabletOrMobile === next.tabletOrMobile && prev.mobile === next.mobile
          ? prev
          : next,
      );
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Close drawer whenever the user navigates
  useEffect(() => { setExpanded(false); }, [pathname]);

  const isTabletOrMobile = bp.tabletOrMobile;
  const isMobile = bp.mobile;

  const sidebarPx = useMemo(() => {
    if (isTabletOrMobile) return 0;
    return expanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;
  }, [isTabletOrMobile, expanded]);

  return (
    <div style={{ color: "var(--color-text-primary)" }}>
      {hasHeader && (
        <Header
          isMobile={isMobile}
          toggleSidebar={() => setExpanded((p) => !p)}
        />
      )}

      {/* Mobile / tablet drawer */}
      {expanded && isTabletOrMobile && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          />
          <motion.div
            initial={{ x: -SIDEBAR_EXPANDED_W }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50"
            style={{ width: SIDEBAR_EXPANDED_W }}
          >
            <Sidebar expand={true} onClose={() => setExpanded(false)} />
          </motion.div>
        </>
      )}

      <div className="flex">
        {!isTabletOrMobile && (
          <motion.div
            animate={{ width: sidebarPx }}
            transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed top-0 left-0 h-full z-30 flex-shrink-0 ${hasHeader ? "pt-[60px]" : ""}`}
          >
            <Sidebar expand={expanded} />
          </motion.div>
        )}

        <motion.main
          animate={{ marginLeft: sidebarPx, width: `calc(100% - ${sidebarPx}px)` }}
          transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            paddingBottom: isMobile ? BOTTOM_NAV_H : 0,
          }}
        >
          <div>{children}</div>

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
        </motion.main>
      </div>

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <nav
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: BOTTOM_NAV_H, zIndex: 60,
            backgroundColor: "var(--color-nav-bg)",
            borderTop: "1px solid var(--color-divider)",
            display: "flex", alignItems: "stretch",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <BottomNavItem href="/"        icon={<IoMdHome size={22} />}            label="Home"    active={pathname === "/"} />
          <BottomNavItem href="/explore" icon={<RiMovie2Line size={22} />}         label="Explore" active={pathname.startsWith("/explore") || pathname.startsWith("/hypemode")} />
          <BottomNavItem href="/chatbot" icon={<MdChatBubbleOutline size={22} />} label="AI Chat" active={pathname === "/chatbot"} />
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            aria-label="Open menu"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, flex: 1, padding: "6px 4px", border: "none", background: "transparent",
              cursor: "pointer",
              color: expanded ? "var(--color-accent-primary)" : "var(--color-text-tertiary)",
              transition: "color 0.15s",
            }}
          >
            <MdMenu size={22} />
            <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>Menu</span>
          </button>
        </nav>
      )}
    </div>
  );
}
