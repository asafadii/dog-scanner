import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Book a Demo — DORA",
};

export default function DemoPage() {
  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      <div
        className="calendly-inline-widget"
        data-url="https://calendly.com/hellodora-info/30min"
        style={{ minWidth: "320px", height: "100vh" }}
      />
    </>
  );
}
