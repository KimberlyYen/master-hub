"use client";

import type { Session } from "next-auth";

export default function UserBadge({ session }: { session: Session | null }) {
  if (!session?.user) return null;

  const name = session.user.name ?? session.user.email ?? "使用者";
  const initial = name.charAt(0).toUpperCase();

  return (
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
      <span className="truncate text-sm font-medium text-zinc-700">{name}</span>
    </div>
  );
}
