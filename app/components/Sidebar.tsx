"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";
import UserMenu from "./UserMenu";

type NavItem = { label: string; href: string; icon: string };

const mainNav: NavItem[] = [
  { label: "研究所申請追蹤", href: "/applications", icon: "◈" },
  { label: "文件總覽",       href: "/documents",    icon: "📋" },
  { label: "申請時程",       href: "/gantt",         icon: "📅" },
];

const bottomNav: NavItem[] = [
  { label: "追蹤設定", href: "/tracking", icon: "⟳" },
  { label: "學校設定", href: "/settings", icon: "⚙" },
];

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const active =
    item.href === "/applications"
      ? pathname === "/" || pathname === "/applications"
      : pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={`relative flex items-center rounded-md px-3 py-2 text-sm transition-colors group
          ${collapsed ? "justify-center px-2" : "gap-2.5"}
          ${active
            ? "bg-zinc-200 text-zinc-900 font-medium dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
      >
        <span className="text-base leading-none shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}

        {/* Tooltip when collapsed (desktop) */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function Sidebar({
  session,
  isGuest,
}: {
  session: Session | null;
  isGuest: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const v = localStorage.getItem("sidebar-collapsed");
    if (v !== null) setCollapsed(v === "true");
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  const navList = (isMobile = false) => (
    <>
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className={`space-y-0.5 ${collapsed && !isMobile ? "px-1" : "px-2"}`}>
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed && !isMobile}
              onClick={isMobile ? () => setMobileOpen(false) : undefined}
            />
          ))}
        </ul>
      </nav>
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-2">
        <ul className={`space-y-0.5 ${collapsed && !isMobile ? "px-1" : "px-2"}`}>
          {bottomNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed && !isMobile}
              onClick={isMobile ? () => setMobileOpen(false) : undefined}
            />
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile hamburger button (fixed, always visible on mobile) ── */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="開啟選單"
        className="md:hidden fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar (fixed overlay) ── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 shadow-lg transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center border-b border-zinc-200 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Master Hub
          </p>
        </div>
        {navList(true)}
        <UserMenu session={session} isGuest={isGuest} collapsed={false} />
      </aside>

      {/* ── Desktop sidebar (in-flow, collapsible) ── */}
      <aside
        className={`hidden md:flex flex-col h-full shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-200
          ${collapsed ? "w-14" : "w-52"}`}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-zinc-200 dark:border-zinc-800 py-3 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {!collapsed && (
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Master Hub
            </p>
          )}
          <button
            onClick={toggleCollapse}
            title={collapsed ? "展開選單" : "收合選單"}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors text-sm"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {navList(false)}
        <UserMenu session={session} isGuest={isGuest} collapsed={collapsed} />
      </aside>
    </>
  );
}
