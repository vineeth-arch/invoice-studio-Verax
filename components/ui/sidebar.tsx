"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FilePenLine,
  ShoppingCart,
  FolderOpen,
  Building2,
  Users,
  BriefcaseBusiness,
  BookOpen,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  UserRound,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Navigation config ────────────────────────────────────────────── */

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Dashboard",       icon: LayoutDashboard },
  { href: "/invoice/new",        label: "New Invoice",     icon: FileText },
  { href: "/purchase-order/new", label: "New PO",          icon: ShoppingCart },
  { href: "/documents",          label: "Documents",       icon: FolderOpen },
  { href: "/drafts",             label: "Drafts",          icon: FilePenLine },
  { href: "/clients",            label: "Clients",         icon: Users },
  { href: "/services",           label: "Services",        icon: BriefcaseBusiness },
  { href: "/sac-codes",          label: "SAC Codes",       icon: BookOpen },
  { href: "/company-profile",    label: "Company Profile", icon: Building2 },
  { href: "/settings",           label: "Settings",        icon: Settings },
];

const REPORT_ITEMS = [
  { href: "/reports/aging", label: "Aging Report",  icon: BarChart3 },
  { href: "/reports/gstr1", label: "GSTR-1 Export", icon: BarChart3 },
];

const COLLAPSED_KEY = "verax_nav_collapsed";

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard")          return pathname === "/dashboard";
  if (href === "/invoice/new")        return pathname.startsWith("/invoice");
  if (href === "/purchase-order/new") return pathname.startsWith("/purchase-order");
  return pathname.startsWith(href);
}

/* ── Tooltip for collapsed state ─────────────────────────────────── */

function CollapseTooltip({ label }: { label: string }) {
  return (
    <span
      className="absolute left-[calc(100%+8px)] z-50 rounded-[var(--r-sm)] px-2 py-1 text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      style={{
        background: "var(--accent)",
        color: "#ffffff",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {label}
    </span>
  );
}

/* ── Nav item ─────────────────────────────────────────────────────── */

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}

function NavItem({ href, label, icon: Icon, active, collapsed, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--r-panel)] transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)]",
        collapsed ? "justify-center px-0 py-3 mx-auto w-10" : "px-3 py-2.5",
        active
          ? "nm-soft"
          : "hover:nm-soft"
      )}
      style={{
        ...(active
          ? { color: "var(--accent)" }
          : { color: "rgba(255,255,255,0.6)" }),
      }}
    >
      {/* Left accent bar for active state — pseudo replacement via box-shadow inset */}
      {active && !collapsed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }}
        />
      )}

      <Icon
        className="shrink-0 transition-colors"
        size={16}
        style={{ color: active ? "var(--accent)" : "rgba(255,255,255,0.55)" }}
      />

      {!collapsed && (
        <>
          <span className="truncate text-[13px] font-medium font-sans">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span
              className="ml-auto rounded-[var(--r-sm)] px-1.5 py-0.5 text-[10px] font-bold font-mono"
              style={{ background: "var(--amber)", color: "#1a1a1a" }}
            >
              {badge}
            </span>
          )}
        </>
      )}

      {collapsed && <CollapseTooltip label={badge ? `${label} [${badge}]` : label} />}
    </Link>
  );
}

/* ── Main sidebar export ──────────────────────────────────────────── */

interface VeRAXSidebarProps {
  draftCount?: number;
  userEmail?: string | null;
  isSignedIn?: boolean;
  onSignOut?: () => void;
}

export function VeRAXSidebar({
  draftCount = 0,
  userEmail,
  isSignedIn = false,
  onSignOut,
}: VeRAXSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY) === "true";
    setCollapsed(stored);
    if (stored) document.documentElement.setAttribute("data-sidebar-collapsed", "");
    setMounted(true);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!accountMenuRef.current?.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      if (next) {
        document.documentElement.setAttribute("data-sidebar-collapsed", "");
      } else {
        document.documentElement.removeAttribute("data-sidebar-collapsed");
      }
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-hidden md:flex no-print"
      style={{
        width: "var(--sidebar-width)",
        /* Dark leather texture */
        backgroundColor: "var(--leather)",
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px,
            transparent 1px, transparent 9px
          ),
          repeating-linear-gradient(
            -45deg,
            rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px,
            transparent 1px, transparent 9px
          )
        `,
        transition: "width 300ms ease",
      }}
    >
      {/* ── Logo / header strip ── brushed metal ───────────────────── */}
      <div
        className="shrink-0 flex items-center"
        style={{
          height: "var(--header-height)",
          background: "linear-gradient(180deg, #d0d6de 0%, #b8c0ca 40%, #c4ccd6 100%)",
          backgroundImage: `linear-gradient(180deg, #d0d6de 0%, #b8c0ca 40%, #c4ccd6 100%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)`,
          padding: collapsed ? "0 12px" : "0 16px",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-btn)]"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-accent-btn)" }}
            >
              <FileText size={14} color="#ffffff" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[13px] font-bold leading-tight truncate font-sans"
                style={{ color: "var(--accent)" }}
              >
                VeRAX
              </div>
              <div
                className="text-[10px] leading-tight truncate font-sans"
                style={{ color: "var(--muted)", letterSpacing: "0.08em" }}
              >
                Invoice Studio
              </div>
            </div>
          </Link>
        )}

        {collapsed && (
          <Link href="/dashboard" aria-label="Dashboard">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[var(--r-btn)]"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-accent-btn)" }}
            >
              <FileText size={14} color="#ffffff" />
            </div>
          </Link>
        )}

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] nm-soft transition-all"
            style={{ background: "var(--base)", color: "var(--muted)" }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* ── Expand button when collapsed ────────────────────────────── */}
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          className="mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] nm-soft transition-all"
          style={{ background: "var(--base)", color: "var(--muted)" }}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3"
        style={{ padding: collapsed ? "12px 8px" : "12px 8px" }}
        aria-label="Main navigation"
      >
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(href, pathname)}
              collapsed={collapsed}
              badge={href === "/drafts" ? draftCount : undefined}
            />
          ))}
        </div>

        {/* Reports section */}
        <div className="mt-4 space-y-0.5">
          {!collapsed && (
            <div
              className="px-3 pb-1.5 pt-3 text-[9px] font-bold uppercase tracking-[0.2em] font-sans"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Reports
            </div>
          )}
          {collapsed && (
            <div className="nm-groove mx-auto my-3 w-8" style={{ background: "rgba(255,255,255,0.08)" }} />
          )}
          {REPORT_ITEMS.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(href, pathname)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* ── Account footer ──────────────────────────────────────────── */}
      <div
        className="shrink-0 p-2 space-y-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative" ref={accountMenuRef}>
          {isSignedIn ? (
            <button
              type="button"
              onClick={() => setShowAccountMenu((p) => !p)}
              className={cn(
                "group relative w-full flex items-center gap-3 rounded-[var(--r-panel)] py-2.5 transition-all duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)] hover:nm-soft",
                collapsed ? "justify-center px-0" : "px-3"
              )}
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(45,106,79,0.3)", color: "var(--paid)" }}
              >
                <CheckCircle size={14} />
              </span>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <div className="text-[12px] font-semibold truncate font-sans" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Signed In
                  </div>
                  {userEmail && (
                    <div className="text-[10px] truncate font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {userEmail.length > 22 ? `${userEmail.slice(0, 19)}…` : userEmail}
                    </div>
                  )}
                </div>
              )}
              {collapsed && <CollapseTooltip label="Signed In" />}
            </button>
          ) : (
            <Link
              href="/auth"
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--r-panel)] py-2.5 transition-all duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)] hover:nm-soft",
                collapsed ? "justify-center px-0" : "px-3"
              )}
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(196,125,26,0.2)", color: "var(--amber)" }}
              >
                <UserRound size={14} />
              </span>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <div className="text-[12px] font-semibold font-sans" style={{ color: "rgba(255,255,255,0.8)" }}>
                    Sign In
                  </div>
                  <div className="text-[10px] font-sans" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Enable cloud sync
                  </div>
                </div>
              )}
              {collapsed && <CollapseTooltip label="Sign In / Sync" />}
            </Link>
          )}

          {/* Account pop-up menu */}
          {isSignedIn && showAccountMenu && onSignOut && (
            <div
              className={cn(
                "absolute z-50 rounded-[var(--r-panel)] p-3",
                collapsed
                  ? "left-[calc(100%+8px)] top-0 w-56"
                  : "bottom-[calc(100%+8px)] left-0 right-0"
              )}
              style={{
                background: "var(--base)",
                boxShadow: "var(--shadow-raised-lg)",
              }}
            >
              {userEmail && (
                <p
                  className="truncate text-[12px] font-medium font-sans pb-2 mb-2"
                  style={{
                    color: "var(--text-mid)",
                    borderBottom: "1px solid rgba(163,177,198,0.3)",
                  }}
                >
                  {userEmail}
                </p>
              )}
              <button
                type="button"
                onClick={() => { setShowAccountMenu(false); onSignOut(); }}
                className="w-full text-[12px] font-semibold font-sans py-2 px-3 rounded-[var(--r-btn)] nm-raised transition-all"
                style={{ color: "var(--overdue)" }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
