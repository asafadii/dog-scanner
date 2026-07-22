import Image from "next/image";
import Link from "next/link";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function FooterBand() {
  return (
    <footer className="bg-[#06342F] text-[#cfe7e2]">
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 gap-9 px-6 py-[52px] sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-[11px]">
            <Image
              src="/dora-badge.svg"
              alt=""
              width={40}
              height={40}
              className="rounded-[11px]"
            />
            <span className="font-display text-xl font-extrabold text-white">
              hello DORA
            </span>
          </div>
          <p className="mt-3.5 max-w-[280px] text-[14.5px] text-[#9ec9c1]">
            The operating system for dog daycares.
          </p>
        </div>

        <div>
          <div className="mb-3.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#7fa9a2]">
            Legal
          </div>
          <div className="flex flex-col gap-2.5 text-[14.5px] font-semibold">
            <Link
              href="/privacy"
              className="w-fit rounded text-[#cfe7e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#06342F]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="w-fit rounded text-[#cfe7e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#06342F]"
            >
              Service Agreement
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3.5 text-xs font-extrabold uppercase tracking-[0.1em] text-[#7fa9a2]">
            Contact Us
          </div>
          <div className="mb-3 flex gap-3">
            <a
              href="https://instagram.com/hellodora.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-[#9ec9c1] transition-colors hover:text-white"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
          <a
            href="mailto:info@hellodora.app"
            className="mt-1 inline-block rounded text-sm font-bold text-[#A4D2C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#06342F]"
          >
            info@hellodora.app
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1140px] px-6 py-[18px] text-[13px] text-[#7fa9a2] sm:px-10">
          © {new Date().getFullYear()} hello DORA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
