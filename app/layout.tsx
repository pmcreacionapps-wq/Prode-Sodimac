import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "@/components/ui/toaster";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Next World Cup 2026",
    description: "Predict FIFA World Cup 2026 matches and compete with classmates.",
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
