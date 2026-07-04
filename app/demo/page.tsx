import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Book a Demo — DORA",
};

export default function DemoPage() {
  return (
    <div className="min-h-full bg-background">
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
      {/* Third-party Calendly embed — centered in a design-system container for
          desktop consistency (D-02 / STAFF-10), no bespoke desktop layout. */}
      <div className="mx-auto max-w-5xl px-4">
        <div
          className="calendly-inline-widget"
          data-url="https://calendly.com/hellodora-info/30min"
          style={{ minWidth: "320px", height: "100vh" }}
        />
      </div>
    </div>
  );
}
