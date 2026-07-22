import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { LandingButton } from "@/components/landing/LandingButton";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function HeroBand() {
  return (
    <div className="relative overflow-hidden bg-primary">
      {/* Paw watermark (design HTML, opacity .10, top-right) */}
      <div
        className="pointer-events-none absolute -right-[30px] -top-10 opacity-10"
        aria-hidden
      >
        <svg width="280" height="280" viewBox="0 0 28 28" fill="#fff">
          <ellipse cx="14" cy="18.5" rx="6.6" ry="5.6" />
          <circle cx="5.6" cy="12" r="2.5" />
          <circle cx="10.6" cy="7.4" r="2.6" />
          <circle cx="17.4" cy="7.4" r="2.6" />
          <circle cx="22.4" cy="12" r="2.5" />
        </svg>
      </div>

      {/* NAV */}
      <nav
        className="relative z-[5] mx-auto flex max-w-[1140px] flex-wrap items-center gap-x-6 gap-y-4 px-6 pb-2 pt-[22px] sm:px-10"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-[11px] rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-[#06342F] bg-[#FBF3E6] shadow-sticker-sm">
            <Image src="/dora-icon.svg" alt="" width={30} height={30} />
          </span>
          <span className="leading-none">
            <span className="block text-[11px] font-semibold text-[#a9ddd4]">
              hello
            </span>
            <span className="block font-display text-2xl font-extrabold text-white">
              DORA
            </span>
          </span>
        </Link>
        <div className="flex gap-5 text-[13px] font-bold sm:mx-auto sm:gap-7 sm:text-[15px]">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded text-[#e8f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-[13px]">
          <Link
            href="/login"
            className="rounded text-[15px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border-2 border-[#06342F] bg-white px-[18px] py-[11px] text-[14px] font-extrabold text-primary shadow-sticker-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Staff signup
          </Link>
          <Link
            href="/portal/signup"
            className="rounded-xl border-2 border-[rgba(255,255,255,0.55)] bg-transparent px-[17px] py-2.5 text-[14px] font-extrabold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Owner signup
          </Link>
        </div>
      </nav>

      {/* HERO CONTENT */}
      <div className="relative z-[5] mx-auto grid max-w-[1140px] items-center gap-12 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-[50px] lg:pb-[84px]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#06342F] bg-mint px-[15px] py-2 text-[12.5px] font-extrabold uppercase tracking-[0.03em] text-[#06342F] shadow-sticker-sm">
            <Image src="/dora-icon.svg" alt="" width={15} height={15} />
            Purpose-built for dog daycares
          </div>
          <h1 className="mt-[22px] font-display text-[40px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[60px]">
            The operating system for{" "}
            <span className="mt-1.5 inline-block whitespace-nowrap rounded-[10px] bg-marker px-3 py-[3px] text-[#06342F] shadow-[4px_4px_0_#06342F] rotate-[-1.5deg]">
              dog daycares.
            </span>
          </h1>
          <p className="mt-10 max-w-[500px] text-[18.5px] font-medium leading-[1.6] text-[#c9ece5]">
            Manage bookings, check-ins, boarding, kennel assignments, payments,
            and daily operations from one modern platform built specifically for
            dog daycare businesses.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <LandingButton href="/signup" variant="outline" size="lg">
              Staff signup
            </LandingButton>
            <LandingButton href="/portal/signup" variant="marker" size="lg">
              Owner signup
            </LandingButton>
            <LandingButton href="/demo" variant="ghost" size="lg" className="text-white">
              Book a Demo →
            </LandingButton>
          </div>
          <p className="mt-[22px] text-[14px] font-semibold text-[#a9ddd4]">
            No credit card required · 14-day free trial
          </p>
        </div>

        {/* Hero sticker dashboard + floaty badge */}
        <div className="relative">
          <div className="absolute -left-[8px] -top-[28px] z-[3] animate-floaty sm:-left-[26px] sm:-top-[42px]">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#06342F] bg-marker shadow-sticker sm:h-20 sm:w-20 sm:rounded-[20px]">
              <Image src="/dora-icon.svg" alt="" width={36} height={36} className="sm:w-12 sm:h-12" />
            </span>
          </div>
          <DashboardMockup />
        </div>
      </div>
    </div>
  );
}
