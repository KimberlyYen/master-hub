"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function loginWithGoogle() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/login?error=Configuration");
  }
  await signIn("google", { redirectTo: "/applications" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
