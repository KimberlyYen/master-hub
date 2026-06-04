"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const mainNav: NavItem[] = [
  { label: "研究所申請追蹤", href: "/applications", icon: "◈" },
];

const bottomNav: NavItem[] = [
  { label: "追蹤設定", href: "/tracking", icon: "⟳" },
  { label: "學校設定", href: "/settings", icon: "⚙" },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    item.href === "/applications"
      ? pathname === "/" || pathname === "/applications"
      : pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-zinc-200 text-zinc-900 font-medium dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="text-base leading-none">{item.icon}</span>
        {item.label}
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Master Hub
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-zinc-200 py-2 dark:border-zinc-800">
        <ul className="space-y-0.5 px-2">
          {bottomNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </div>
    </aside>
  );
}
