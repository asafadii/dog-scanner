"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "How does owner check-in work?",
    answer:
      "Owners receive a secure QR code tied to their booking. On arrival, staff scan it to instantly check the dog in, assign a kennel, and surface any notes like medication or first-visit flags.",
  },
  {
    question: "Can I manage boarding and daycare?",
    answer:
      "Yes. DORA handles both same-day daycare and multi-night boarding stays, with separate availability, pricing, and kennel assignments for each so your team always knows who is staying over.",
  },
  {
    question: "Can I export reports?",
    answer:
      "Yes. Generate financial and operational reports for any date range and export them with one click for accounting, payroll, or business planning.",
  },
  {
    question: "Can multiple staff members use DORA?",
    answer:
      "Yes. Add your whole team to DORA so front desk staff and managers can all check dogs in, manage bookings, and see what's happening in your facility in real time.",
  },
  {
    question: "Can I migrate from spreadsheets?",
    answer:
      "Yes. Import your existing dog profiles, owners, and bookings from spreadsheets during onboarding, and our team will help you get set up without losing any history.",
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.531_0.092_185.0)]">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[oklch(0.205_0.006_89.9)] sm:text-4xl">
            Common questions
          </h2>
        </div>

        <div className="mt-10 divide-y divide-[oklch(0.885_0.000_89.9)] rounded-2xl border border-[oklch(0.885_0.000_89.9)]">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold text-[oklch(0.205_0.006_89.9)]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-[oklch(0.556_0.000_89.9)] transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-[oklch(0.556_0.000_89.9)]">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
