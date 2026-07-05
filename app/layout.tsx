import { Providers } from "@/components/app/Providers";
import type { Metadata, Viewport } from "next";
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "hello DORA",
  description: "The operating system for dog daycares.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "hello DORA",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/dora-favicon.svg",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#077D73",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
