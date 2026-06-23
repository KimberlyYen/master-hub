import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { GUEST_MODE_COOKIE, hasGuestCookie } from "./lib/guestMode";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Master Hub",
  description: "研究所在職專班申請追蹤系統",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const cookieStore = await cookies();
  const isGuest =
    !session?.user && hasGuestCookie(cookieStore.get(GUEST_MODE_COOKIE)?.value);

  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen w-full">
        <AppShell session={session} isGuest={isGuest}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
