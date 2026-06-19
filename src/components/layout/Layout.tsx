"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { IoMdHome } from "react-icons/io";
import { RiMovie2Line } from "react-icons/ri";
import { MdChatBubbleOutline, MdMenu } from "react-icons/md";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { SiteFooter } from "@/features/home/components/SiteFooter";
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

  // Close drawer whenever the user navigates
  useEffect(() => { setExpanded(false); }, [pathname]);

  const sidebarPx = expanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;

  return (
    <div style={{ color: "var(--color-text-primary)" }}>
      {hasHeader && <Header toggleSidebar={() => setExpanded((p) => !p)} />}

      {/* Mobile / tablet drawer — CSS-hidden at desktop widths (min-[1121px]),
          so visibility is correct on the very first paint and never depends
          on a JS viewport check or a resize event firing. */}
      {expanded && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm min-[1121px]:hidden"
            onClick={() => setExpanded(false)}
          />
          <motion.div
            initial={{ x: -SIDEBAR_EXPANDED_W }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 min-[1121px]:hidden"
            style={{ width: SIDEBAR_EXPANDED_W }}
          >
            <Sidebar expand={true} onClose={() => setExpanded(false)} />
          </motion.div>
        </>
      )}

      <div className="flex">
        {/* Persistent desktop sidebar — CSS-gated (>=1121px); width is a plain
            CSS transition so it never animates on initial load, only when the
            user toggles expand/collapse. */}
        <div
          className={`hidden min-[1121px]:block layout-sidebar fixed top-0 left-0 h-full z-30 flex-shrink-0 ${hasHeader ? "pt-[60px]" : ""}`}
          style={{ width: sidebarPx }}
        >
          <Sidebar expand={expanded} />
        </div>

        <main
          className="layout-main flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            "--sidebar-w": `${sidebarPx}px`,
            "--bottom-nav-h": `${BOTTOM_NAV_H}px`,
          } as React.CSSProperties}
        >
          <div>{children}</div>

          <SiteFooter />
        </main>
      </div>

      {/* Mobile bottom navigation — CSS-gated (<=768px), always in the DOM so
          it's correct on the very first paint, no JS/resize race. */}
      <nav className="layout-bottom-nav" style={{ height: BOTTOM_NAV_H }}>
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
    </div>
  );
}
