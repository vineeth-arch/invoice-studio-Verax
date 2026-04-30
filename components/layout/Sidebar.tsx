"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DRAFTS_STORAGE_EVENT, getDraftCounts } from "@/lib/utils/drafts";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

function truncateEmail(email: string) {
  if (email.length <= 20) return email;
  return `${email.slice(0, 17)}...`;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [supabase] = useState(() => getSupabaseBrowserClient());

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    if (!supabase) return;

    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      setShowAccountMenu(false);
      router.push("/auth");
    } finally {
      setIsSigningOut(false);
    }
  }, [router, supabase]);

  const isDark = theme === "dark";
  const secondaryTextClass = isDark ? "text-slate-300" : "text-slate-600";

  const navItemClassName = useCallback(
    (active: boolean) =>
      cn(
        "group relative flex items-center gap-3 rounded-xl border-l-[3px] transition-all duration-150",
        collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
        active
          ? isDark
            ? "bg-[rgba(245,197,24,0.15)] text-white font-semibold"
            : "bg-[rgba(26,26,110,0.1)] text-[#1a1a6e] font-semibold"
          : isDark
            ? "border-transparent text-slate-100 hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
            : "border-transparent text-slate-800 hover:bg-[rgba(26,26,110,0.08)] hover:text-[#1a1a6e]",
      ),
    [collapsed, isDark],
  );

  const navIconClassName = useCallback(
    (active: boolean) =>
      cn(
        "h-4 w-4 shrink-0 transition-colors",
        active
          ? isDark
            ? "text-[#F5C518]"
            : "text-[#1a1a6e]"
          : isDark
            ? "text-slate-100 group-hover:text-white"
            : "text-slate-700 group-hover:text-[#1a1a6e]",
      ),
    [isDark],
  );

  const renderCollapsedTooltip = useCallback(
    (label: string) => (
      <span
        className={cn(
          "absolute left-[calc(100%+8px)] z-50 rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
          isDark ? "bg-slate-950 text-slate-50" : "bg-white text-slate-900",
        )}
      >
        {label}
      </span>
    ),
    [isDark],
  );

  if (!mounted) return null;

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-hidden bg-sidebar-bg transition-[width] duration-300 md:flex no-print"
        style={{ width: "var(--sidebar-width)", borderRight: "1px solid var(--border)" }}
      >
        {collapsed ? (
          <div className="flex shrink-0 flex-col items-center py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/dashboard" aria-label="Dashboard">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-yellow)" }}>
                <FileText className="h-5 w-5" style={{ color: "#111111" }} />
              </div>
            </Link>
            <button
              onClick={toggleCollapsed}
              className="mt-3 flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-text-muted)" }}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--accent-yellow)" }}>
                <FileText className="h-5 w-5" style={{ color: "#111111" }} />
              </div>
              <span className={cn("font-display text-[13px] font-bold leading-tight whitespace-nowrap", isDark ? "text-slate-50" : "text-slate-900")}>
                Invoice Studio
              </span>
            </Link>
            <button
              onClick={toggleCollapsed}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              style={{ color: "var(--sidebar-text-muted)" }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            const isDraftsItem = href === "/drafts";

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={navItemClassName(active)}
                style={{
                  borderLeftColor: active ? (isDark ? "#F5C518" : "#1a1a6e") : "transparent",
                }}
              >
                <Icon className={navIconClassName(active)} />
                {!collapsed && (
                  <>
                    <span className="truncate text-sm font-medium">{label}</span>
                    {isDraftsItem && draftCount > 0 && (
                      <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        {draftCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && renderCollapsedTooltip(isDraftsItem && draftCount > 0 ? `${label} [${draftCount}]` : label)}
              </Link>
            );
          })}

          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            className={navItemClassName(isActive("/settings", pathname))}
            style={{
              borderLeftColor: isActive("/settings", pathname) ? (isDark ? "#F5C518" : "#1a1a6e") : "transparent",
            }}
          >
            <Settings className={navIconClassName(isActive("/settings", pathname))} />
            {!collapsed && <span className="truncate text-sm font-medium">Settings</span>}
            {collapsed && renderCollapsedTooltip("Settings")}
          </Link>

          {!collapsed && (
            <div className={cn("px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em]", secondaryTextClass)}>
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
                className={navItemClassName(active)}
                style={{
                  borderLeftColor: active ? (isDark ? "#F5C518" : "#1a1a6e") : "transparent",
                }}
              >
                <Icon className={navIconClassName(active)} />
                {!collapsed && <span className="truncate text-sm font-medium">{label}</span>}
                {collapsed && renderCollapsedTooltip(label)}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 px-2 py-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="relative" ref={accountMenuRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setShowAccountMenu((prev) => !prev)}
                title={collapsed ? `Signed In${user.email ? ` · ${user.email}` : ""}` : undefined}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl border-l-[3px] transition-all duration-150",
                  collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                  isDark
                    ? "border-transparent text-slate-100 hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
                    : "border-transparent text-slate-800 hover:bg-[rgba(26,26,110,0.08)] hover:text-[#1a1a6e]",
                )}
              >
                <CheckCircle className="h-4 w-4 shrink-0 text-[#22c55e]" />
                {!collapsed && (
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold">Signed In</div>
                    <div className={cn("mt-0.5 truncate text-xs", secondaryTextClass)}>
                      {loading ? "Checking session..." : truncateEmail(user.email ?? "No email")}
                    </div>
                  </div>
                )}
                {collapsed && renderCollapsedTooltip("Signed In")}
              </button>
            ) : (
              <Link
                href="/auth"
                title={collapsed ? "Sign In / Sync" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border-l-[3px] transition-all duration-150",
                  collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                  isDark
                    ? "text-slate-100 hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
                    : "text-slate-800 hover:bg-[rgba(26,26,110,0.08)] hover:text-[#1a1a6e]",
                )}
                style={{
                  borderLeftColor: "#F5C518",
                  background: isDark ? "rgba(245,197,24,0.08)" : "rgba(245,197,24,0.12)",
                }}
              >
                <LogIn className={cn("h-4 w-4 shrink-0", isDark ? "text-slate-100 group-hover:text-white" : "text-slate-700 group-hover:text-[#1a1a6e]")} />
                {!collapsed && (
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold">Sign In / Sync</div>
                    <div className={cn("mt-0.5 text-xs", secondaryTextClass)}>Enable cloud backup</div>
                  </div>
                )}
                {collapsed && renderCollapsedTooltip("Sign In / Sync")}
              </Link>
            )}

            {user && showAccountMenu && (
              <div
                className={cn(
                  "absolute z-50 rounded-xl border p-3 shadow-xl",
                  collapsed ? "left-[calc(100%+8px)] top-0 w-64" : "bottom-[calc(100%+8px)] left-0 right-0",
                  isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white",
                )}
              >
                <p className={cn("truncate text-sm font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>
                  {user.email ?? "Signed in"}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className={cn(
                    "mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
                    isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-slate-100 text-slate-900 hover:bg-slate-200",
                  )}
                >
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-l-[3px] transition-colors",
              collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
              isDark
                ? "text-slate-100 hover:bg-[rgba(255,255,255,0.12)] hover:text-white"
                : "text-slate-800 hover:bg-[rgba(26,26,110,0.08)] hover:text-[#1a1a6e]",
            )}
            style={{ borderLeftColor: "transparent" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className={cn("h-4 w-4 shrink-0", isDark ? "text-slate-100" : "text-slate-700")} />
            ) : (
              <Moon className={cn("h-4 w-4 shrink-0", isDark ? "text-slate-100" : "text-slate-700")} />
            )}
            {!collapsed && (
              <span className={cn("text-sm font-medium", isDark ? "text-slate-100" : "text-slate-800")}>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>
        </div>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around px-2 md:hidden no-print"
        style={{ background: "var(--sidebar-bg)", borderTop: "1px solid var(--border)" }}
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors",
                active ? (isDark ? "text-white" : "text-[#1a1a6e]") : isDark ? "text-slate-100" : "text-slate-700",
              )}
            >
              <Icon className={cn("h-5 w-5", active && isDark ? "text-[#F5C518]" : undefined)} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        <button
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition-colors",
            isDark ? "text-slate-100" : "text-slate-700",
          )}
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
