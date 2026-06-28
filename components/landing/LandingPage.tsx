import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { LandingButton } from "@/components/landing/LandingButton";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { RosterMockup } from "@/components/landing/RosterMockup";
import {
  BarChart3,
  Calendar,
  Check,
  CreditCard,
  Grid3X3,
  LayoutDashboard,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Live Dog Dashboard",
    description: "Know exactly which dogs are currently in your facility.",
  },
  {
    icon: Calendar,
    title: "Online Bookings",
    description: "Let owners book daycare and boarding online.",
  },
  {
    icon: QrCode,
    title: "QR Check-In",
    description: "Fast owner check-in using secure QR codes.",
  },
  {
    icon: Grid3X3,
    title: "Kennel Management",
    description: "Assign dogs to kennels and track placements.",
  },
  {
    icon: CreditCard,
    title: "Payments & Checkout",
    description: "Track cash, card, and booking revenue.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description:
      "Generate and export operational and financial reports instantly.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create accounts",
    description: "Owners create accounts and add their dogs.",
  },
  {
    number: "02",
    title: "Book online",
    description: "Owners book daycare or boarding online.",
  },
  {
    number: "03",
    title: "Check in with QR",
    description: "Staff check dogs in using QR codes.",
  },
  {
    number: "04",
    title: "Manage the stay",
    description: "Manage stays, kennel assignments and payments.",
  },
  {
    number: "05",
    title: "Report & grow",
    description: "Generate reports and grow your business.",
  },
];

const SOCIAL_PROOF = [
  "Bark & Co",
  "PawHaus",
  "FetchClub",
  "Hounds Inn",
  "Wagmore",
  "RoverLodge",
];

const SPOTLIGHT_TAGS = [
  "First Visit",
  "Medication",
  "Transport Required",
  "Boarding",
  "Daycare",
];

const PRICING_FEATURES = [
  "Online bookings",
  "Dog profiles",
  "Check-ins",
  "Payments",
  "Reporting",
];

export function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="font-sans bg-white text-[oklch(0.205_0.006_89.9)]">
      {/* Sticky nav */}
      <header className="sticky top-0 z-50 border-b border-[oklch(0.885_0.000_89.9)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/dora-logo.svg"
              alt="hello DORA"
              width={140}
              height={36}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[oklch(0.556_0.000_89.9)] transition-colors hover:text-[oklch(0.531_0.092_185.0)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-[oklch(0.556_0.000_89.9)] hover:text-[oklch(0.531_0.092_185.0)] sm:inline"
            >
              Sign In
            </Link>
            <LandingButton href="/signup" size="sm">
              Staff signup
            </LandingButton>
            <LandingButton href="/portal/signup" variant="outline" size="sm">
              Owner signup
            </LandingButton>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.828_0.050_180.2/0.35),transparent_55%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
                Purpose-built for dog daycares
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[oklch(0.205_0.006_89.9)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                The operating system for dog daycares.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[oklch(0.556_0.000_89.9)]">
                Manage bookings, check-ins, boarding, kennel assignments,
                payments, and daily operations from one modern platform built
                specifically for dog daycare businesses.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <LandingButton href="/signup" size="lg">
                  Staff signup
                </LandingButton>
                <LandingButton href="/portal/signup" variant="outline" size="lg">
                  Owner signup
                </LandingButton>
                <LandingButton href="mailto:hello@hellodora.com" variant="outline" size="lg">
                  Book a Demo
                </LandingButton>
              </div>
              <p className="mt-4 text-sm text-[oklch(0.725_0.000_89.9)]">
                No credit card required, 14-day free trial
              </p>
            </div>
            <div className="lg:pl-4">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-y border-[oklch(0.885_0.000_89.9)] bg-[oklch(0.985_0_0)] py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-sm font-medium text-[oklch(0.556_0.000_89.9)]">
              Trusted by modern dog daycare businesses.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {SOCIAL_PROOF.map((name) => (
                <span
                  key={name}
                  className="text-base font-semibold tracking-tight text-[oklch(0.770_0.000_89.9)]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your team needs, every day
              </h2>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[oklch(0.885_0.000_89.9)] bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[oklch(0.828_0.050_180.2)] text-[oklch(0.531_0.092_185.0)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[oklch(0.556_0.000_89.9)]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Spotlight / About */}
        <section
          id="about"
          className="border-y border-[oklch(0.885_0.000_89.9)] bg-[oklch(0.985_0_0)] py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
                Built for operations
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built around the dogs, not spreadsheets.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[oklch(0.556_0.000_89.9)]">
                Most software focuses on customer databases. DORA focuses on
                daily operations, giving your team a real-time view of every
                dog currently in your facility.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SPOTLIGHT_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[oklch(0.885_0.000_89.9)] bg-white px-3 py-1 text-xs font-medium text-[oklch(0.556_0.000_89.9)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <RosterMockup />
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                From booking to checkout in five steps
              </h2>
            </div>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((step) => (
                <li key={step.number} className="relative">
                  <p className="text-3xl font-bold tabular-nums text-[oklch(0.828_0.050_180.2)]">
                    {step.number}
                  </p>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[oklch(0.556_0.000_89.9)]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-y border-[oklch(0.885_0.000_89.9)] bg-[oklch(0.985_0_0)] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent plans
              </h2>
            </div>
            <div className="mx-auto mt-12 max-w-md">
              <div className="relative rounded-2xl border-2 border-[oklch(0.531_0.092_185.0)] bg-white p-8 shadow-lg">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[oklch(0.531_0.092_185.0)] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
                <h3 className="text-center text-xl font-bold">Starter</h3>
                <p className="mt-2 text-center text-3xl font-bold text-[oklch(0.531_0.092_185.0)]">
                  Custom pricing
                </p>
                <ul className="mt-8 space-y-3">
                  {PRICING_FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-[oklch(0.556_0.000_89.9)]"
                    >
                      <Check
                        className="h-4 w-4 shrink-0 text-[oklch(0.531_0.092_185.0)]"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <LandingButton
                  href="mailto:hello@hellodora.com"
                  className="mt-8 w-full"
                  size="lg"
                >
                  Contact sales
                </LandingButton>
              </div>
            </div>
          </div>
        </section>

        <LandingFAQ />

        {/* Final CTA */}
        <section className="bg-[oklch(0.531_0.092_185.0)] py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Run your daycare, not your paperwork.
            </h2>
            <p className="mt-4 text-lg text-[oklch(0.828_0.050_180.2)]">
              Everything you need to manage dogs, bookings, boarding, and
              payments in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <LandingButton href="/signup" variant="inverted" size="lg">
                Staff signup
              </LandingButton>
              <LandingButton
                href="/portal/signup"
                variant="outline"
                size="lg"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Owner signup
              </LandingButton>
              <LandingButton
                href="mailto:hello@hellodora.com"
                variant="outline"
                size="lg"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Book a Demo
              </LandingButton>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[oklch(0.885_0.000_89.9)] bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Image
                src="/dora-logo.svg"
                alt="hello DORA"
                width={120}
                height={32}
                className="h-7 w-auto"
              />
              <p className="mt-3 max-w-xs text-sm text-[oklch(0.556_0.000_89.9)]">
                The operating system for dog daycares.
              </p>
            </div>
            <nav
              className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
              aria-label="Footer navigation"
            >
              <a
                href="#features"
                className="text-[oklch(0.556_0.000_89.9)] hover:text-[oklch(0.531_0.092_185.0)]"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-[oklch(0.556_0.000_89.9)] hover:text-[oklch(0.531_0.092_185.0)]"
              >
                Pricing
              </a>
              <a
                href="#"
                className="text-[oklch(0.556_0.000_89.9)] hover:text-[oklch(0.531_0.092_185.0)]"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-[oklch(0.556_0.000_89.9)] hover:text-[oklch(0.531_0.092_185.0)]"
              >
                Terms
              </a>
            </nav>
          </div>
          <p className="mt-10 text-sm text-[oklch(0.725_0.000_89.9)]">
            &copy; {year} hello DORA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
