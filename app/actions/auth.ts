"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { GUEST_MODE_COOKIE } from "@/app/lib/guestMode";

async function clearGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_MODE_COOKIE);
}

export async function loginWithGoogle() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/login?error=Configuration");
  }
  await clearGuestCookie();
  await signIn("google", { redirectTo: "/applications" });
}

export async function enterGuestMode() {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_MODE_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/applications");
}

export async function logout() {
  await clearGuestCookie();
  const session = await auth();
  if (session?.user) {
    await signOut({ redirectTo: "/login" });
  }
  redirect("/login");
}
