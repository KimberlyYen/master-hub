import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
  description: "個人工具集",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile top bar — creates space below the fixed hamburger button */}
          <div className="md:hidden flex h-12 shrink-0 items-center border-b border-zinc-200 bg-white px-4 pl-14">
            <span className="text-sm font-semibold text-zinc-600">Master Hub</span>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
