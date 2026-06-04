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
    default: "Prode Sodimac 2026 | Equipo Sodimac",
    template: "%s | Prode Sodimac 2026",
  },
  description:
    "Predecí los partidos del Mundial FIFA 2026 y competí con tu equipo de Sodimac.",
  keywords: ["Mundial 2026", "FIFA", "prode", "predicciones", "Sodimac"],
  authors: [{ name: "Equipo Sodimac" }],
  creator: "Equipo Sodimac",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Prode Sodimac 2026",
    description: "Predecí los partidos del Mundial FIFA 2026 y competí con tu equipo.",
    siteName: "Prode Sodimac 2026",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prode Sodimac 2026",
    description: "Predecí los partidos del Mundial FIFA 2026 y competí con tu equipo.",
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
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
