"use client";

import { useState, useEffect, useCallback } from "react";
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
  Sun,
  Moon,
  LogIn,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DRAFTS_STORAGE_EVENT, getDraftCounts } from "@/lib/utils/drafts";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice/new", label: "New Invoice", icon: FileText },
  { href: "/purchase-order/new", label: "New PO", icon: ShoppingCart },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/drafts", label: "Drafts", icon: FilePenLine },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/services", label: "Services", icon: BriefcaseBusiness },
  { href: "/sac-codes", label: "SAC Codes", icon: BookOpen },
  { href: "/company-profile", label: "Company Profile", icon: Building2 },
];

const REPORT_ITEMS = [
  { href: "/reports/aging", label: "Aging Report", icon: BarChart3 },
  { href: "/reports/gstr1", label: "GSTR-1 Export", icon: BarChart3 },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice/new", label: "Invoice", icon: FileText },
  { href: "/purchase-order/new", label: "PO", icon: ShoppingCart },
  { href: "/documents", label: "Docs", icon: FolderOpen },
];

const NAV_COLLAPSED_KEY = "di_nav_collapsed";
const THEME_KEY = "di_theme";

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/invoice/new") return pathname.startsWith("/invoice");
  if (href === "/purchase-order/new") return pathname.startsWith("/purchase-order");
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { loading, user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const refreshDraftCount = useCallback(() => {
    setDraftCount(getDraftCounts().total);
  }, []);

  useEffect(() => {
    const storedCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    const storedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    setCollapsed(storedCollapsed);
    setTheme(storedTheme ?? (systemDark ? "dark" : "light"));

    if (storedCollapsed) {
      document.documentElement.setAttribute("data-sidebar-collapsed", "");
    }
    refreshDraftCount();
    setMounted(true);
  }, [refreshDraftCount]);

  useEffect(() => {
    refreshDraftCount();
  }, [pathname, refreshDraftCount]);

  useEffect(() => {
    const handleStorage = () => refreshDraftCount();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(DRAFTS_STORAGE_EVENT, handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(DRAFTS_STORAGE_EVENT, handleStorage);
    };
  }, [refreshDraftCount]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(NAV_COLLAPSED_KEY, String(next));
      if (next) {
        document.documentElement.setAttribute("data-sidebar-collapsed", "");
      } else {
        document.documentElement.removeAttribute("data-sidebar-collapsed");
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      return next;
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="fixed left-0 top-0 h-screen flex-col hidden md:flex no-print z-40 bg-sidebar-bg overflow-hidden transition-[width] duration-300"
        style={{ width: "var(--sidebar-width)", borderRight: "1px solid var(--border)" }}
      >
        {/* Header */}
        {collapsed ? (
          <div className="flex flex-col items-center py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/dashboard" aria-label="Dashboard">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-yellow)" }}>
                <FileText className="h-5 w-5" style={{ color: "#111111" }} />
              </div>
            </Link>
            <button
              onClick={toggleCollapsed}
              className="mt-3 h-6 w-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-text-muted)" }}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-yellow)" }}>
                <FileText className="h-5 w-5" style={{ color: "#111111" }} />
              </div>
              <span className="font-display font-bold text-[13px] leading-tight whitespace-nowrap" style={{ color: "var(--sidebar-text)" }}>
                Invoice Studio
              </span>
            </Link>
            <button
              onClick={toggleCollapsed}
              className="h-6 w-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10 shrink-0"
              style={{ color: "var(--sidebar-text-muted)" }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            const isDraftsItem = href === "/drafts";
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-150 relative group",
                  collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                )}
                style={{
                  background: active ? "var(--sidebar-active-bg)" : undefined,
                  color: active ? "var(--accent-yellow)" : "var(--sidebar-text-muted)",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"; }}
              >
                {/* Yellow left-edge accent bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: "var(--accent-yellow)" }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium truncate">{label}</span>
                    {isDraftsItem && draftCount > 0 && (
                      <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        {draftCount}
                      </span>
                    )}
                  </>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span
                    className="absolute left-[calc(100%+8px)] px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                    style={{ background: "#111111", color: "#F0EFE9" }}
                  >
                    {isDraftsItem && draftCount > 0 ? `${label} [${draftCount}]` : label}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2">
            {!collapsed ? (
              user ? (
                <div
                  className="rounded-xl px-3 py-3"
                  style={{ border: "1px solid var(--border)", background: "rgba(245, 197, 24, 0.06)" }}
                >
                  <Link
                    href="/auth"
                    className="flex items-start gap-3 transition-opacity hover:opacity-85"
                  >
                    <User className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-yellow)" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Signed In ✓
                      </div>
                      <div className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {loading ? "Checking session..." : user.email}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-white/5"
                  style={{ color: "var(--sidebar-text-muted)" }}
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium truncate">Sign In / Sync</span>
                </Link>
              )
            ) : (
              <Link
                href="/auth"
                title={user ? `Signed In ✓${user.email ? ` · ${user.email}` : ""}` : "Sign In / Sync"}
                className="group relative flex items-center justify-center rounded-xl px-3 py-3 transition-all duration-150 hover:bg-white/5"
                style={{ color: user ? "var(--accent-yellow)" : "var(--sidebar-text-muted)" }}
              >
                {user ? <User className="h-4 w-4 shrink-0" /> : <LogIn className="h-4 w-4 shrink-0" />}
                <span
                  className="absolute left-[calc(100%+8px)] px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                  style={{ background: "#111111", color: "#F0EFE9" }}
                >
                  {user ? "Signed In ✓" : "Sign In / Sync"}
                </span>
              </Link>
            )}
          </div>

          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl transition-all duration-150 relative group",
              collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
            )}
            style={{
              background: isActive("/settings", pathname) ? "var(--sidebar-active-bg)" : undefined,
              color: isActive("/settings", pathname) ? "var(--accent-yellow)" : "var(--sidebar-text-muted)",
            }}
            onMouseEnter={(e) => { if (!isActive("/settings", pathname)) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; }}
            onMouseLeave={(e) => { if (!isActive("/settings", pathname)) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"; }}
          >
            {isActive("/settings", pathname) && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                style={{ background: "var(--accent-yellow)" }}
              />
            )}
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium truncate">Settings</span>}
            {collapsed && (
              <span
                className="absolute left-[calc(100%+8px)] px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                style={{ background: "#111111", color: "#F0EFE9" }}
              >
                Settings
              </span>
            )}
          </Link>

          {!collapsed && (
            <div className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--sidebar-text-muted)" }}>
              Reports
            </div>
          )}
          {REPORT_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-150 relative group",
                  collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                )}
                style={{
                  background: active ? "var(--sidebar-active-bg)" : undefined,
                  color: active ? "var(--accent-yellow)" : "var(--sidebar-text-muted)",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-muted)"; }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: "var(--accent-yellow)" }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
                {collapsed && (
                  <span
                    className="absolute left-[calc(100%+8px)] px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
                    style={{ background: "#111111", color: "#F0EFE9" }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Theme Toggle + Version */}
        <div
          className="px-2 py-2 space-y-1 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 rounded-xl w-full transition-colors hover:bg-white/10",
              collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5"
            )}
            style={{ color: "var(--sidebar-text-muted)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && (
              <span className="text-sm font-medium">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px]" style={{ color: "var(--sidebar-text-muted)" }}>
              v1.0 · India · INR
            </p>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-2 no-print z-40 md:hidden"
        style={{ background: "var(--sidebar-bg)", borderTop: "1px solid var(--border)" }}
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
              style={{ color: active ? "var(--accent-yellow)" : "var(--sidebar-text-muted)" }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        <button
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
          style={{ color: "var(--sidebar-text-muted)" }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </nav>
    </>
  );
}
