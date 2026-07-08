import Image from "next/image";
import { Music2 } from "lucide-react";
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

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M14 8.5V6.75C14 6.06 14.56 5.5 15.25 5.5H17V2.5H15.25C12.9 2.5 11 4.4 11 6.75V8.5H9V11.5H11V21.5H14V11.5H16.1L16.5 8.5H14Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6.5 9.5H3.75V20.5H6.5V9.5ZM5.125 8.125C5.95 8.125 6.625 7.45 6.625 6.625C6.625 5.8 5.95 5.125 5.125 5.125C4.3 5.125 3.625 5.8 3.625 6.625C3.625 7.45 4.3 8.125 5.125 8.125ZM9.5 9.5H12.15V10.825C12.65 9.95 13.775 9.25 15.2 9.25C18.175 9.25 20.5 11.425 20.5 15.35V20.5H17.75V15.775C17.75 14.275 17.275 13.3 15.95 13.3C14.875 13.3 14.225 14 13.975 14.675C13.875 14.925 13.85 15.275 13.85 15.625V20.5H11.1C11.125 14.05 11.1 9.5 11.1 9.5H9.5Z" />
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
              href="#"
              aria-label="Instagram"
              className="text-[#9ec9c1] transition-colors hover:text-white"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-[#9ec9c1] transition-colors hover:text-white"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-[#9ec9c1] transition-colors hover:text-white"
            >
              <LinkedinIcon className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="text-[#9ec9c1] transition-colors hover:text-white"
            >
              <Music2 className="h-5 w-5" />
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
