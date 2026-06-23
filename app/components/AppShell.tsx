"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import Sidebar from "./Sidebar";
import UserBadge from "./UserBadge";
import LanguageSwitcher from "./LanguageSwitcher";
import GoogleTranslateProvider from "./GoogleTranslateProvider";

export default function AppShell({
  children,
  session,
  isGuest,
}: {
  children: React.ReactNode;
  session: Session | null;
  isGuest: boolean;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <>
        <GoogleTranslateProvider />
        <main className="flex min-h-screen w-full flex-1 items-center justify-center bg-zinc-50 px-4">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <GoogleTranslateProvider />
      <div className="flex min-h-screen w-full flex-1">
      <Sidebar session={session} isGuest={isGuest} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
          <span className="text-sm font-semibold text-zinc-600 pl-10 md:pl-0">
            Master Hub
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <UserBadge session={session} isGuest={isGuest} />
          </div>
        </header>
        {children}
      </div>
      </div>
    </>
  );
}
