import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-marker py-[84px]">
      {/* Paw watermark (design HTML, opacity .16, #06342F) */}
      <div
        className="pointer-events-none absolute -right-6 -top-8 opacity-[0.16]"
        aria-hidden
      >
        <svg width="260" height="260" viewBox="0 0 28 28" fill="#06342F">
          <ellipse cx="14" cy="18.5" rx="6.6" ry="5.6" />
          <circle cx="5.6" cy="12" r="2.5" />
          <circle cx="10.6" cy="7.4" r="2.6" />
          <circle cx="17.4" cy="7.4" r="2.6" />
          <circle cx="22.4" cy="12" r="2.5" />
        </svg>
      </div>

      <div className="relative z-[5] mx-auto max-w-[820px] px-6 text-center sm:px-10">
        <h2 className="font-display text-[38px] font-extrabold leading-[1.1] tracking-tight text-[#17211D] sm:text-[54px]">
          Run your daycare, not your paperwork.
        </h2>
        <p className="mt-4 text-[18px] font-semibold text-[#5a4a1e]">
          Everything you need to manage dogs, bookings, boarding, and payments in
          one place.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl border-[2.5px] border-[#06342F] bg-primary px-6 text-base font-extrabold text-white shadow-[5px_5px_0_#06342F] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06342F] focus-visible:ring-offset-2 focus-visible:ring-offset-marker"
          >
            Staff signup
          </Link>
          <Link
            href="/portal/signup"
            className="inline-flex h-12 items-center justify-center rounded-xl border-[2.5px] border-[#06342F] bg-white px-6 text-base font-extrabold text-[#06342F] shadow-[5px_5px_0_#06342F] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06342F] focus-visible:ring-offset-2 focus-visible:ring-offset-marker"
          >
            Owner signup
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-12 items-center justify-center rounded-xl border-[2.5px] border-[#06342F] bg-transparent px-6 text-base font-extrabold text-[#06342F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06342F] focus-visible:ring-offset-2 focus-visible:ring-offset-marker"
          >
            Book a Demo →
          </Link>
        </div>
      </div>
    </section>
  );
}
