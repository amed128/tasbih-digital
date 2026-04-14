import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "../components/ThemeSync";
import { ReminderScheduler } from "../components/ReminderScheduler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "At-tasbih",
    template: "%s — At-tasbih",
  },
  description:
    "Compteur de zikr islamique. Suivez votre pratique du dhikr, gérez vos listes et consultez vos statistiques. Gratuit, hors ligne, sans compte.",
  keywords: ["tasbih", "zikr", "dhikr", "compteur islamique", "muslim", "prayer counter", "تسبيح", "ذكر"],
  openGraph: {
    title: "At-tasbih — Compteur de zikr islamique",
    description:
      "Suivez votre pratique du dhikr. Listes personnalisées, statistiques, mode audio. Gratuit et hors ligne.",
    type: "website",
    locale: "fr_FR",
    siteName: "At-tasbih",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "At-tasbih" }],
  },
  twitter: {
    card: "summary",
    title: "At-tasbih — Compteur de zikr islamique",
    description:
      "Suivez votre pratique du dhikr. Listes personnalisées, statistiques, mode audio. Gratuit et hors ligne.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#F5A623" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-title" content="At-tasbih" />
        {/* data-app-icon lets ThemeSync swap these dynamically based on the chosen icon theme */}
        <link rel="icon" href="/icon-192-blue.png" data-app-icon="true" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" href="/icon-192-blue.png" data-app-icon="true" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeSync />
        <ReminderScheduler />
        {children}
      </body>
    </html>
  );
}
