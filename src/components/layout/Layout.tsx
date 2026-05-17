"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W } from "@/lib/constants";

interface LayoutProps {
  children: ReactNode;
  hasHeader?: boolean;
}

export default function Layout({ children, hasHeader = true }: LayoutProps) {
  const [expanded, setExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState(1280);

  useEffect(() => {
    setScreenWidth(window.innerWidth);
    const fn = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const isTabletOrMobile = screenWidth <= 1120;
  const isMobile = screenWidth <= 420;

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

      {/* Mobile drawer overlay */}
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
            <Sidebar expand={true} />
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
          style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}
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
    </div>
  );
}
