import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Next World Cup 2026 | Next English Institute",
    template: "%s | Next World Cup 2026",
  },
  description:
    "Predict FIFA World Cup 2026 matches and compete with your classmates at Next English Institute.",
  keywords: ["World Cup 2026", "FIFA", "prode", "predictions", "Next English Institute"],
  authors: [{ name: "Next English Institute" }],
  creator: "Next English Institute",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Next World Cup 2026",
    description: "Predict FIFA World Cup 2026 matches and compete with classmates.",
    siteName: "Next World Cup 2026",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Next World Cup 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next World Cup 2026",
    description: "Predict FIFA World Cup 2026 matches and compete with classmates.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
