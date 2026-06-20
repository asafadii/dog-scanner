import { LandingPage } from "@/components/landing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "hello DORA, The operating system for dog daycares",
  description:
    "Manage bookings, check-ins, boarding, kennel assignments, payments, and daily operations from one modern platform built specifically for dog daycare businesses.",
  icons: {
    icon: "/dora-favicon.svg",
  },
};

export default function Page() {
  return <LandingPage />;
}
