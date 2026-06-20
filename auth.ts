import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";

function isEmailAllowed(email: string | null | undefined): boolean {
  const allowed = process.env.AUTH_ALLOWED_EMAILS;
  if (!allowed?.trim()) return true;
  const emails = allowed.split(",").map((e) => e.trim().toLowerCase());
  return emails.includes((email ?? "").toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user }) {
      return isEmailAllowed(user.email);
    },
  },
});
