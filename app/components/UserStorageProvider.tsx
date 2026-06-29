"use client";

import { createContext, useContext, useMemo } from "react";
import type { Session } from "next-auth";
import { resolveUserStorageKey } from "../lib/userStorageKey";

type UserStorageContextValue = {
  storageKey: string;
  isLoggedIn: boolean;
  isGuest: boolean;
  displayName: string | null;
};

const UserStorageContext = createContext<UserStorageContextValue | null>(null);

export function UserStorageProvider({
  session,
  isGuest,
  children,
}: {
  session: Session | null;
  isGuest: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      storageKey: resolveUserStorageKey(session, isGuest),
      isLoggedIn: !!session?.user,
      isGuest,
      displayName: session?.user?.name ?? session?.user?.email ?? null,
    }),
    [session, isGuest]
  );

  return (
    <UserStorageContext.Provider value={value}>
      {children}
    </UserStorageContext.Provider>
  );
}

export function useUserStorage() {
  const ctx = useContext(UserStorageContext);
  if (!ctx) {
    throw new Error("useUserStorage must be used within UserStorageProvider");
  }
  return ctx;
}
