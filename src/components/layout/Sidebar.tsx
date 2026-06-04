"use client";

import {
  useState, useRef, useCallback, useEffect,
  type ReactNode, type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

import { IoMdHome } from "react-icons/io";
import { IoSunnyOutline } from "react-icons/io5";
import { TbVideoPlus } from "react-icons/tb";
import {
  FaMoon, FaCrown, FaInfoCircle, FaShoppingCart,
  FaSignOutAlt, FaUserTie, FaUser,
} from "react-icons/fa";
import {
  MdChatBubbleOutline, MdOutlineDescription, MdOutlinePrivacyTip,
  MdLocalOffer, MdOutlineArticle,
} from "react-icons/md";
import {
  RiAddCircleLine, RiFlagLine, RiListCheck, RiMessageLine,
  RiMovie2Line, RiShoppingBagLine, RiStoreLine, RiCustomerService2Line,
  RiFileList3Line,
} from "react-icons/ri";
import { X } from "lucide-react";

import { SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W } from "@/lib/constants";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import { changeUserType } from "@/features/profile/services/profileService";
import type { UserType } from "@/types";

interface SidebarProps {
  expand: boolean;
  onClose?: () => void;
}

// ─── Portal Tooltip ───────────────────────────────────────────
const Tip = ({ label, children }: { label: string; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  return (
    <div
      ref={ref}
      className="w-full"
      onMouseEnter={() => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ top: r.top + r.height / 2, left: r.right + 10 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && typeof document !== "undefined" &&
        createPortal(
          <div style={{
            position: "fixed", zIndex: 9999, pointerEvents: "none",
            top: pos.top, left: pos.left, transform: "translateY(-50%)",
            padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
            fontSize: 11.5, fontWeight: 600,
            backgroundColor: "var(--color-bg-inverse)",
            color: "var(--color-text-inverse)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            animation: "sbTip 0.12s ease-out",
          }}>
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
};

// ─── NavItem ─────────────────────────────────────────────────
interface NavItemProps {
  href?: string;
  icon: ReactNode;
  label: string;
  expand: boolean;
  active?: boolean;
  gold?: boolean;
  danger?: boolean;
  badge?: ReactNode;
  as?: "button";
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

const NavItem = ({
  href, icon, label, expand, active, gold, danger, badge, as: asEl, onClick,
}: NavItemProps) => {
  const [hovered, setHovered] = useState(false);

  const cls = [
    "relative flex items-center w-full rounded-xl transition-all duration-150 cursor-pointer select-none outline-none",
    "focus-visible:ring-2 focus-visible:ring-orange-400/40",
    expand ? "gap-3 px-3 py-2.5" : "justify-center py-3",
  ].join(" ");

  const style = active
    ? { color: "var(--color-accent-primary)", backgroundColor: "rgba(255,187,0,0.10)", fontWeight: 600 }
    : gold
      ? { color: "var(--color-accent-primary)", backgroundColor: hovered ? "rgba(255,187,0,0.07)" : "transparent" }
      : danger
        ? { color: "var(--color-danger,#EF4444)", backgroundColor: hovered ? "rgba(239,68,68,0.07)" : "transparent" }
        : { color: "var(--color-text-secondary)", backgroundColor: hovered ? "rgba(0,0,0,0.04)" : "transparent" };

  const events = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  const inner = (
    <>
      {active && (
        <motion.span
          layoutId="activeBar"
          className="absolute inset-y-[8px] left-0 w-[3px] rounded-r-full"
          style={{ background: "var(--color-accent-primary)" }}
        />
      )}
      <span className="flex-shrink-0 flex items-center justify-center text-[17px] leading-none">{icon}</span>
      <AnimatePresence initial={false}>
        {expand && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto", transition: { width: { duration: 0.18 }, opacity: { duration: 0.14, delay: 0.1 } } }}
            exit={{ opacity: 0, width: 0, transition: { opacity: { duration: 0.08 }, width: { duration: 0.18, delay: 0.05 } } }}
            className="flex-1 text-[13px] leading-none truncate font-medium overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {expand && badge && (
          <motion.span key="badge" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} className="flex-shrink-0">
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  const wrapped = asEl === "button" ? (
    <button type="button" onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void} className={cls} style={style} {...events}>
      {inner}
    </button>
  ) : (
    <Link href={href ?? "#"} onClick={onClick as (e: MouseEvent<HTMLAnchorElement>) => void} className={cls} style={style} {...events}>
      {inner}
    </Link>
  );

  return !expand ? <Tip label={label}>{wrapped}</Tip> : wrapped;
};

// ─── Section label ────────────────────────────────────────────
const SectionLabel = ({ text, expand }: { text: string; expand: boolean }) =>
  expand ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 12px 6px" }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
    </div>
  ) : (
    <div style={{ margin: "10px 14px", height: 1, background: "var(--color-divider)", opacity: 0.6 }} />
  );

// ─── Marketplace Section ──────────────────────────────────────
const MarketplaceSection = ({
  expand, userMode, pathname,
}: {
  expand: boolean;
  userMode: "buyer" | "seller";
  pathname: string;
}) => {
  const isSeller = userMode === "seller";
  const modeColor = isSeller ? "#a78bfa" : "var(--color-accent-primary)";
  const modeBg    = isSeller ? "rgba(139,92,246,0.1)" : "rgba(255,187,0,0.1)";

  return (
    <div>
      <SectionLabel text="Marketplace" expand={expand} />

      {expand ? (
        <div style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 6 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 9999,
            backgroundColor: modeBg, color: modeColor, border: `1px solid ${modeBg}`,
          }}>
            {isSeller ? <FaUserTie size={8} /> : <FaShoppingCart size={8} />}
            {isSeller ? "Seller Mode" : "Buyer Mode"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, backgroundColor: modeBg, color: modeColor }}>
            {isSeller ? "SELL" : "BUY"}
          </span>
        </div>
      )}

      <nav className="space-y-0.5">
        <NavItem href="/marketplace/browse" icon={<RiStoreLine />}      label="Browse"         expand={expand} active={pathname === "/marketplace/browse"} />
        <NavItem href="/marketplace/messages" icon={<RiMessageLine />}  label="Messages"       expand={expand} active={pathname === "/marketplace/messages"} />
        {isSeller ? (
          <>
            <NavItem href="/marketplace/listings/new"      icon={<RiAddCircleLine />} label="Create Listing" expand={expand} active={pathname === "/marketplace/listings/new"} />
            <NavItem href="/marketplace/dashboard/seller"  icon={<RiListCheck />}     label="Dashboard"      expand={expand} active={pathname === "/marketplace/dashboard/seller"} />
            <NavItem href="/marketplace/orders"            icon={<RiShoppingBagLine />} label="My Orders"    expand={expand} active={pathname === "/marketplace/orders"} />
            <NavItem href="/marketplace/analytics"         icon={<RiMovie2Line />}    label="Analytics"      expand={expand} active={pathname === "/marketplace/analytics"} />
          </>
        ) : (
          <>
            <NavItem href="/marketplace/dashboard/buyer"   icon={<RiListCheck />}     label="Dashboard"      expand={expand} active={pathname === "/marketplace/dashboard/buyer"} />
            <NavItem href="/marketplace/orders"            icon={<RiShoppingBagLine />} label="My Orders"    expand={expand} active={pathname === "/marketplace/orders"} />
            <NavItem href="/marketplace/offers"            icon={<MdLocalOffer />}    label="My Offers"      expand={expand} active={pathname === "/marketplace/offers"} />
            <NavItem href="/marketplace/listings/new"      icon={<RiAddCircleLine />} label="Create Listing" expand={expand} active={pathname === "/marketplace/listings/new"} />
          </>
        )}
      </nav>
    </div>
  );
};

// ─── Profile Popup ────────────────────────────────────────────
const POPUP_W = 256;

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  userMode: "buyer" | "seller" | "";
  onModeChange: (m: "buyer" | "seller") => Promise<void>;
}

const ProfilePopup = ({ isOpen, onClose, anchorRef, userMode, onModeChange }: ProfilePopupProps) => {
  const { authUser, logout } = useAuth();
  const { isDark, setMode } = useTheme();
  const router = useRouter();
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [switching, setSwitching] = useState(false);

  const refreshPos = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.top - 8, left: r.left });
  }, [anchorRef]);

  useEffect(() => { if (isOpen) refreshPos(); }, [isOpen, refreshPos]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("resize", refreshPos);
    window.addEventListener("scroll", refreshPos, true);
    return () => {
      window.removeEventListener("resize", refreshPos);
      window.removeEventListener("scroll", refreshPos, true);
    };
  }, [isOpen, refreshPos]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: Event) => {
      const t = e.target as Node;
      if (
        popRef.current && !popRef.current.contains(t) &&
        anchorRef.current && !anchorRef.current.contains(t)
      ) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [isOpen, onClose, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  const switchMode = async (m: "buyer" | "seller") => {
    if (m === userMode || switching) return;
    setSwitching(true);
    await onModeChange(m);
    setSwitching(false);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
    router.push("/");
  };

  if (!isOpen || !authUser) return null;

  const hasPaid = authUser.hasPaid ?? false;
  const hasRole = userMode === "buyer" || userMode === "seller";

  const popup = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed", zIndex: 9998,
            width: POPUP_W,
            bottom: `calc(100vh - ${pos.top}px)`,
            left: pos.left,
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-secondary)",
            borderRadius: 18,
            boxShadow: "0 12px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}
        >
          <div style={{ height: 3, background: "linear-gradient(90deg,#FFBB00,#E6A800)" }} />

          {/* User info */}
          <div style={{ padding: "14px 14px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-divider)" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 9999,
                background: "linear-gradient(135deg,#FFBB00,#E6A800)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.9rem", fontWeight: 700, overflow: "hidden",
                boxShadow: "0 2px 8px rgba(255,107,0,0.3)",
              }}>
                {authUser.avatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={authUser.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : (authUser.username?.[0] ?? "U").toUpperCase()}
              </div>
              {hasPaid && (
                <span style={{
                  position: "absolute", top: -1, right: -1,
                  width: 16, height: 16, borderRadius: 9999,
                  background: "linear-gradient(135deg,#FFBB00,#E6A800)",
                  border: "2px solid var(--color-bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FaCrown size={7} color="#fff" />
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {authUser.username}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: hasPaid ? "#FFBB00" : "var(--color-text-tertiary)" }}>
                {hasPaid ? "✦ Premium Member" : "Free Plan"}
              </p>
            </div>
          </div>

          <div style={{ padding: 6 }}>
            {/* View Profile */}
            <Link
              href={`/user/${authUser._id}`}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                borderRadius: 10, textDecoration: "none", color: "var(--color-text-secondary)",
                fontSize: 13, fontWeight: 500, transition: "background-color 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <FaUser size={12} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
              View Profile
            </Link>

            {/* Marketplace mode switcher */}
            {hasRole && (
              <div style={{ padding: "6px 4px" }}>
                <p style={{ margin: "0 0 6px 6px", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)" }}>
                  Marketplace Mode
                </p>
                <div style={{ display: "flex", borderRadius: 12, padding: 3, gap: 3, background: "var(--color-bg-tertiary)" }}>
                  {(["buyer", "seller"] as const).map(m => {
                    const isActive = userMode === m;
                    const c = m === "seller" ? "#a78bfa" : "#FFBB00";
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={switching}
                        onClick={() => switchMode(m)}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "7px 0", borderRadius: 9, border: "none",
                          cursor: switching ? "not-allowed" : "pointer",
                          fontSize: 11, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
                          ...(isActive
                            ? { background: "var(--color-bg-elevated)", color: c, boxShadow: "0 1px 4px rgba(0,0,0,0.09)" }
                            : { background: "transparent", color: "var(--color-text-tertiary)", opacity: switching ? 0.5 : 1 }),
                        }}
                      >
                        {m === "buyer" ? <><FaShoppingCart size={10} /> Buyer</> : <><FaUserTie size={10} /> Seller</>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Theme switcher */}
            <div style={{ padding: "6px 4px" }}>
              <p style={{ margin: "0 0 6px 6px", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)" }}>
                Appearance
              </p>
              <div style={{ display: "flex", borderRadius: 12, padding: 3, gap: 3, background: "var(--color-bg-tertiary)" }}>
                {([
                  { mode: "light" as const, Icon: IoSunnyOutline, label: "Light" },
                  { mode: "dark"  as const, Icon: FaMoon,         label: "Dark"  },
                ]).map(({ mode, Icon, label }) => {
                  const isActive = (mode === "light" && !isDark) || (mode === "dark" && isDark);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMode(mode)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        padding: "7px 0", borderRadius: 9, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
                        ...(isActive
                          ? { background: "var(--color-bg-elevated)", color: "#FFBB00", boxShadow: "0 1px 4px rgba(0,0,0,0.09)" }
                          : { background: "transparent", color: "var(--color-text-tertiary)" }),
                      }}
                    >
                      <Icon size={12} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--color-divider)", margin: "0 6px" }} />

          <div style={{ padding: 6 }}>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
                width: "100%", border: "none", background: "transparent", cursor: "pointer",
                color: "var(--color-danger,#EF4444)", fontSize: 13, fontWeight: 500,
                fontFamily: "inherit", textAlign: "left", transition: "background-color 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <FaSignOutAlt size={13} style={{ flexShrink: 0 }} />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(popup, document.body);
};

// ─── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar({ expand, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { authUser, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [userMode, setUserMode] = useState<"buyer" | "seller" | "">(() => {
    if (typeof window === "undefined") return "";
    return (authUser?.userType === "buyer" || authUser?.userType === "seller")
      ? authUser.userType
      : "";
  });

  const [popupOpen, setPopupOpen] = useState(false);
  const profileRef = useRef<HTMLButtonElement>(null);

  // Sync userMode when authUser is refreshed (login, token restore, etc.)
  useEffect(() => {
    if (!authUser) { setUserMode(""); return; }
    if (authUser.userType === "buyer" || authUser.userType === "seller") {
      setUserMode(authUser.userType);
    }
  }, [authUser]);

  const handleModeChange = useCallback(async (newMode: "buyer" | "seller") => {
    if (!authUser?._id) return;
    const prev = userMode;
    setUserMode(newMode);   // optimistic update
    try {
      await changeUserType(authUser._id, newMode as UserType);
      // Persist the change into the auth cache so re-mounts read the correct type
      await refreshUser();
    } catch {
      setUserMode(prev);
    }
  }, [authUser?._id, userMode, refreshUser]);

  const isActive = (p: string) => pathname === p;
  const showMarketplace = isAuthenticated && (userMode === "buyer" || userMode === "seller");

  const hasPaid = authUser?.hasPaid ?? false;

  const handleHypeModeClick = useCallback((e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (hasPaid) {
      e.preventDefault();
      toast.success("HypeMode Premium is active! Enjoy your access.", { icon: "👑", duration: 3000 });
      router.push("/hypemode");
    }
  }, [hasPaid, router]);

  return (
    <>
      <style>{`@keyframes sbTip { from{opacity:0;transform:translateY(-50%) translateX(-4px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }`}</style>

      <motion.aside
        animate={{ width: expand ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W }}
        transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col h-full border-r overflow-hidden"
        style={{ backgroundColor: "var(--color-nav-bg)", borderColor: "var(--color-divider)" }}
      >
        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {onClose && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 6px" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                Menu
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 9999, border: "none",
                  background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)",
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="px-1.5 py-3 pt-5 space-y-0.5">
            <nav className="space-y-0.5">
              <NavItem href="/" icon={<IoMdHome />} label="Home" expand={expand} active={isActive("/")} />
              <NavItem
                href={hasPaid ? "/hypemode" : "/explore"}
                onClick={hasPaid ? handleHypeModeClick : undefined}
                icon={
                  <span className="relative inline-flex items-center justify-center">
                    <RiMovie2Line />
                    {hasPaid && (
                      <FaCrown className="absolute -top-2 -right-1.5 drop-shadow-sm" size={8} style={{ color: "#FFBB00" }} />
                    )}
                  </span>
                }
                label="Hype Mode"
                expand={expand}
                active={isActive("/explore") || isActive("/hypemode")}
                gold={hasPaid}
                badge={hasPaid
                  ? <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, backgroundColor: "rgba(255,187,0,0.1)", color: "#FFBB00", border: "1px solid rgba(255,187,0,0.2)" }}>PRO</span>
                  : undefined}
              />
              <NavItem href="/video-editor" icon={<TbVideoPlus />}        label="Video Editor" expand={expand} active={isActive("/video-editor")} />
              <NavItem href="/chatbot"      icon={<MdChatBubbleOutline />} label="AI ChatBot"   expand={expand} active={isActive("/chatbot")} />
              <NavItem href="/scripts"      icon={<RiFileList3Line />}     label="Scripts"      expand={expand} active={pathname.startsWith("/scripts")} />
            </nav>

            {showMarketplace && (
              <MarketplaceSection
                expand={expand}
                userMode={userMode as "buyer" | "seller"}
                pathname={pathname}
              />
            )}

            <SectionLabel text="More" expand={expand} />

            <nav className="space-y-0.5">
              <NavItem href="/blog"                 icon={<MdOutlineArticle />}      label="Blog"    expand={expand} active={pathname.startsWith("/blog")} />
              <NavItem href="/about"                icon={<FaInfoCircle />}           label="About"   expand={expand} active={isActive("/about")} />
              <NavItem href="/support"              icon={<RiCustomerService2Line />} label="Support" expand={expand} active={isActive("/support")} />
              <NavItem href="/report"               icon={<RiFlagLine />}             label="Report"  expand={expand} active={isActive("/report")} />
              <NavItem href="/privacy-policy"       icon={<MdOutlinePrivacyTip />}   label="Privacy" expand={expand} active={isActive("/privacy-policy")} />
              <NavItem href="/terms-and-conditions" icon={<MdOutlineDescription />}  label="Terms"   expand={expand} active={isActive("/terms-and-conditions")} />
            </nav>
          </div>
        </div>

        {/* Profile button at bottom */}
        {isAuthenticated && authUser && (
          <div style={{ borderTop: "1px solid var(--color-divider)", padding: "8px 6px" }}>
            {!expand ? (
              <Tip label={authUser.username}>
                <button
                  ref={profileRef}
                  type="button"
                  onClick={() => setPopupOpen(p => !p)}
                  aria-label={`Open profile menu for ${authUser.username ?? "your account"}`}
                  aria-expanded={popupOpen}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "8px 0", borderRadius: 12, border: "none", cursor: "pointer",
                    background: popupOpen ? "rgba(255,187,0,0.08)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9999, overflow: "hidden",
                    background: "linear-gradient(135deg,#FFBB00,#E6A800)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {authUser.avatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={authUser.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      : (authUser.username?.[0] ?? "U").toUpperCase()}
                  </div>
                </button>
              </Tip>
            ) : (
              <button
                ref={profileRef}
                type="button"
                onClick={() => setPopupOpen(p => !p)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: popupOpen ? "rgba(255,187,0,0.08)" : "transparent",
                  transition: "background 0.15s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!popupOpen) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                onMouseLeave={e => { if (!popupOpen) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9999, overflow: "hidden", flexShrink: 0,
                  background: "linear-gradient(135deg,#FFBB00,#E6A800)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff",
                }}>
                  {authUser.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={authUser.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : (authUser.username?.[0] ?? "U").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {authUser.username}
                  </p>
                  {userMode && (
                    <p style={{ margin: 0, fontSize: 10, color: userMode === "seller" ? "#a78bfa" : "var(--color-accent-primary)", fontWeight: 600 }}>
                      {userMode === "seller" ? "Seller" : "Buyer"}
                    </p>
                  )}
                </div>
              </button>
            )}
          </div>
        )}

        {/* Sign-in prompt for unauthenticated users */}
        {!isAuthenticated && expand && (
          <div style={{ borderTop: "1px solid var(--color-divider)", padding: "10px 8px" }}>
            <Link
              href="/login"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "9px 0", borderRadius: 12, textDecoration: "none",
                background: "var(--color-accent-primary)", color: "#fff",
                fontSize: 12, fontWeight: 700,
              }}
            >
              Sign In
            </Link>
          </div>
        )}
      </motion.aside>

      <ProfilePopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        anchorRef={profileRef}
        userMode={userMode}
        onModeChange={handleModeChange}
      />
    </>
  );
}
