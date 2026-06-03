"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Film,
  FileText,
  CreditCard,
  Settings,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingBag,
  BookOpen,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Videos", icon: Film, href: "/admin/videos" },
  { label: "Scripts", icon: FileText, href: "/admin/scripts" },
  { label: "Transactions", icon: CreditCard, href: "/admin/transactions" },
  { label: "Marketplace", icon: ShoppingBag, href: "/admin/marketplace" },
  { label: "Blog", icon: BookOpen, href: "/admin/blog" },
  { label: "Domain", icon: Globe, href: "/admin/domain" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, authUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-[var(--ap-border)] px-4 py-5 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-[var(--ap-text)] text-sm tracking-wider">WECINEMA</span>
              <span className="block text-[10px] text-[var(--ap-accent)] font-mono tracking-widest">ADMIN PANEL</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[var(--ap-text-2)] hover:bg-[var(--ap-hover)] hover:text-[var(--ap-text)] transition-all hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative
                  ${active
                    ? "border text-[var(--ap-text)]"
                    : "text-[var(--ap-text-2)] hover:bg-[var(--ap-hover)] hover:text-[var(--ap-text)] border border-transparent"
                  } ${collapsed ? "justify-center" : ""}`}
                style={active ? { background: "var(--ap-accent-soft)", borderColor: "var(--ap-accent-ring)" } : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                    style={{ background: "var(--ap-accent)" }}
                  />
                )}
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color: active ? "var(--ap-accent)" : undefined }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--ap-surface-alt)] text-[var(--ap-text)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[var(--ap-border)] shadow-lg">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer: profile · theme · logout */}
      <div className="px-2 py-3 border-t border-[var(--ap-border)] space-y-1">
        {/* Admin profile */}
        {!collapsed && authUser && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-600">
              {(authUser.username ?? "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ap-text)] truncate">{authUser.username ?? "Admin"}</p>
              <p className="text-[11px] text-[var(--ap-text-3)] truncate">Administrator</p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--ap-text-2)] hover:bg-[var(--ap-hover)] hover:text-[var(--ap-text)] transition-all ${collapsed ? "justify-center" : ""}`}
        >
          {isDark ? <Sun className="w-4.5 h-4.5 flex-shrink-0" /> : <Moon className="w-4.5 h-4.5 flex-shrink-0" />}
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">{isDark ? "Light mode" : "Dark mode"}</span>
          )}
        </button>

        {/* Logout */}
        <motion.button
          whileHover={{ x: collapsed ? 0 : 4 }}
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--ap-text-2)] hover:bg-red-500/10 hover:text-red-500 transition-all group ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:text-red-500" />
          {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Logout</span>}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-purple-600 text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-64 bg-[var(--ap-surface)] border-r border-[var(--ap-border)] z-50 md:hidden shadow-2xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--ap-text-2)] hover:bg-[var(--ap-hover)]"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebarContent()}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col h-screen sticky top-0 bg-[var(--ap-surface)] border-r border-[var(--ap-border)] overflow-hidden flex-shrink-0 shadow-xl"
      >
        {renderSidebarContent()}
      </motion.aside>
    </>
  );
}
