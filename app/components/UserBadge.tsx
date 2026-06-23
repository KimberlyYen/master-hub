"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { logout } from "../actions/auth";

export default function UserBadge({
  session,
  isGuest,
}: {
  session: Session | null;
  isGuest: boolean;
}) {
  if (session?.user) {
    const name = session.user.name ?? session.user.email ?? "使用者";
    const initial = name.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center gap-2 min-w-0 max-w-[10rem] sm:max-w-xs"
          title={session.user.email ?? name}
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
              {initial}
            </span>
          )}
          <span className="truncate text-sm font-medium text-zinc-700">
            {name}
          </span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            登出
          </button>
        </form>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
          訪客模式
        </span>
        <Link
          href="/login"
          className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          登入
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            登出
          </button>
        </form>
      </div>
    );
  }

  return null;
}
