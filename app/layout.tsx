import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeSync } from "../components/ThemeSync";
import { ReminderScheduler } from "../components/ReminderScheduler";
import { AppIconSync } from "../components/AppIconSync";
import { ThemeDecorations } from "../components/ThemeDecorations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://at-tasbih.app"),
  title: {
    default: "At-tasbih",
    template: "%s — At-tasbih",
  },
  description:
    "Islamic zikr counter. Track your daily dhikr practice, manage your lists, and view your statistics. Free, offline, no account needed.",
  keywords: ["tasbih", "zikr", "dhikr", "islamic counter", "muslim", "prayer counter", "تسبيح", "ذكر"],
  openGraph: {
    title: "At-tasbih — Islamic Zikr Counter",
    description:
      "Track your dhikr practice. Custom lists, statistics, audio mode. Free and offline.",
    type: "website",
    locale: "en_US",
    siteName: "At-tasbih",
  },
  twitter: {
    card: "summary_large_image",
    title: "At-tasbih — Islamic Zikr Counter",
    description:
      "Track your dhikr practice. Custom lists, statistics, audio mode. Free and offline.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "At-tasbih",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description:
                "Islamic zikr counter. Track your daily dhikr practice, manage your lists, and view your statistics. Free, offline, no account needed.",
              url: process.env.NEXT_PUBLIC_APP_URL ?? "https://at-tasbih.app",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* beforeInteractive runs before React hydrates — suppresses the
            React/Turbopack bug where HMR desyncs profiler marks and
            performance.measure receives a negative duration. Dev only. */}
        {process.env.NODE_ENV === "development" && (
          <Script
            id="perf-measure-patch"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: "(function(){var o=performance.measure.bind(performance);performance.measure=function(){try{return o.apply(this,arguments)}catch(e){}};})();" }}
          />
        )}
        <ThemeDecorations />
        <ThemeSync />
        <ReminderScheduler />
        <AppIconSync />
        {children}
      </body>
    </html>
  );
}
