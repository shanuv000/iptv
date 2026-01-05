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
  authors: [{ name: "Vaibhav" }],
  creator: "Vaibhav",
  icons: {
    icon: [
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon.ico", type: "image/x-icon" },
    ],
    apple: [
      { url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon_io/site.webmanifest",
  openGraph: {
    title: "IPTV India | Live TV Streaming",
    description: "Watch 500+ Indian TV channels live",
    type: "website",
    siteName: "IPTV India",
  },
  twitter: {
    card: "summary_large_image",
    title: "IPTV India | Live TV Streaming",
    description: "Watch 500+ Indian TV channels live",
    creator: "@vaibhav",
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
