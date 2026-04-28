"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  FolderOpen,
  Building2,
  Users,
  BriefcaseBusiness,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AuthStatusCard } from "@/components/auth/AuthStatusCard";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice/new", label: "New Invoice", icon: FileText },
  { href: "/purchase-order/new", label: "New PO", icon: ShoppingCart },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/services", label: "Services", icon: BriefcaseBusiness },
  { href: "/company-profile", label: "Company Profile", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 flex flex-col no-print z-40">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-brand-500 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm leading-tight">GST Invoice<br />Generator</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href.replace("/new", "")));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <AuthStatusCard />
        <p className="text-xs text-slate-500">GST Invoice Generator</p>
        <p className="text-xs text-slate-600">India • INR</p>
      </div>
    </aside>
  );
}
