"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { logout } from "../actions/auth";

export default function UserMenu({
  session,
  isGuest,
  collapsed,
}: {
  session: Session | null;
  isGuest: boolean;
  collapsed: boolean;
}) {
  if (session?.user) {
    const name = session.user.name ?? session.user.email ?? "使用者";
    const initial = name.charAt(0).toUpperCase();

    return (
      <div
        className={`border-t border-zinc-200 dark:border-zinc-800 px-2 py-3 ${
          collapsed ? "flex flex-col items-center gap-2" : "space-y-2"
        }`}
      >
        <div
          className={`flex items-center gap-2 min-w-0 ${
            collapsed ? "justify-center" : "px-1"
          }`}
          title={name}
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
              {initial}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-700">{name}</p>
              {session.user.email && (
                <p className="truncate text-[11px] text-zinc-400">
                  {session.user.email}
                </p>
              )}
            </div>
          )}
        </div>

        <form
          action={logout}
          className={collapsed ? "w-full flex justify-center" : "w-full"}
        >
          <button
            type="submit"
            className={`rounded-md text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${
              collapsed ? "px-2 py-1.5" : "w-full px-3 py-1.5 text-left"
            }`}
            title="登出"
          >
            {collapsed ? "⎋" : "登出"}
          </button>
        </form>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div
        className={`border-t border-zinc-200 dark:border-zinc-800 px-2 py-3 ${
          collapsed ? "flex flex-col items-center gap-2" : "space-y-2"
        }`}
      >
        {!collapsed && (
          <p className="px-1 text-xs font-medium text-amber-700">訪客模式</p>
        )}
        <Link
          href="/login"
          className={`block rounded-md text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${
            collapsed ? "px-2 py-1.5" : "w-full px-3 py-1.5"
          }`}
          title="登入"
        >
          {collapsed ? "↪" : "登入"}
        </Link>
        <form
          action={logout}
          className={collapsed ? "w-full flex justify-center" : "w-full"}
        >
          <button
            type="submit"
            className={`rounded-md text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${
              collapsed ? "px-2 py-1.5" : "w-full px-3 py-1.5 text-left"
            }`}
            title="登出"
          >
            {collapsed ? "⎋" : "登出"}
          </button>
        </form>
      </div>
    );
  }

  return null;
}
