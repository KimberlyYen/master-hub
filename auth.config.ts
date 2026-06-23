import type { NextAuthConfig } from "next-auth";
import { GUEST_MODE_COOKIE, hasGuestCookie } from "./app/lib/guestMode";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl, cookies } }) {
      const isLoggedIn = !!auth?.user;
      const isGuest = hasGuestCookie(cookies.get(GUEST_MODE_COOKIE)?.value);
      const pathname = nextUrl.pathname;

      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/notify")) {
        return true;
      }

      if (pathname === "/login") {
        if (isLoggedIn || isGuest) {
          return Response.redirect(new URL("/applications", nextUrl));
        }
        return true;
      }

      return isLoggedIn || isGuest;
    },
  },
} satisfies NextAuthConfig;
