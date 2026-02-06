import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Picsearch",
  description:
    "Search your photos using natural language. Upload images and find them by describing what you see.",
  openGraph: {
    title: "Picsearch",
    description:
      "Search your photos using natural language. Upload images and find them by describing what you see.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Picsearch - Search your photos using natural language",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Picsearch",
    description:
      "Search your photos using natural language. Upload images and find them by describing what you see.",
    images: ["/og.jpg"],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body className={cn(sans.variable, mono.variable, "antialiased")}>
      {children}
      <Analytics />
      <Toaster />
    </body>
  </html>
);

export default RootLayout;
