import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPTV India | Live TV Streaming",
  description: "Watch 500+ Indian TV channels live. News, Entertainment, Sports, Movies, and more - all in one place.",
  keywords: ["IPTV", "Live TV", "Indian TV", "Streaming", "News", "Entertainment", "Sports"],
  openGraph: {
    title: "IPTV India | Live TV Streaming",
    description: "Watch 500+ Indian TV channels live",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
