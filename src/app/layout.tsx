import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/tempcdn/site-header";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  title: "TempCDN — temporary file transit",
  description: "Anonymous file upload with automatic expiry. No login, no trace."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-grain min-h-screen font-sans">
        <SiteHeader />
        <main className="relative z-0">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
