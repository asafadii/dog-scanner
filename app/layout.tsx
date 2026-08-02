import { Providers } from "@/components/app/Providers";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

const display = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const sans = Inter({
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
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  try {
    var consent = localStorage.getItem("dora-cookie-consent");
    if (consent === "granted") {
      c[a]("consentv2", { ad_Storage: "granted", analytics_Storage: "granted" });
    } else {
      c[a]("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
    }
  } catch (e) {
    c[a]("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  }
})(window, document, "clarity", "script", ${JSON.stringify(clarityProjectId)});`}
          </Script>
        ) : null}
        <Providers>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
