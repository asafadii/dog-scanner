"use client";

import { contentSwitch } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
      "Yes. DORA handles both same-day daycare and multi-night boarding stays, with separate availability and kennel assignments for each so your team always knows who is staying over.",
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

export default function FaqBand() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t-[3px] border-b-[3px] border-[#06342F] bg-[#DBEEE8] py-[72px]"
    >
      <div className="mx-auto max-w-[760px] px-6 sm:px-10">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border-2 border-[#06342F] bg-marker px-[15px] py-2 text-[12.5px] font-extrabold uppercase tracking-[0.03em] text-[#5a4a1e] shadow-sticker-sm">
            FAQ
          </div>
          <h2 className="mt-[18px] font-display text-[36px] font-extrabold leading-[1.12] tracking-tight text-[#17211D] sm:text-[46px]">
            Common questions
          </h2>
        </div>

        <div className="mt-10 flex flex-col gap-[13px]">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="rounded-[18px] border-[2.5px] border-[#06342F] bg-white shadow-[5px_5px_0_#06342F]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 rounded-[16px] px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-display text-[17.5px] font-bold text-[#17211D]">
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-display font-extrabold leading-none",
                      isOpen
                        ? "text-[22px] text-primary"
                        : "text-[24px] text-[#06342F]",
                    )}
                    aria-hidden
                  >
                    {isOpen ? "–" : "+"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      {...contentSwitch}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[15px] leading-relaxed text-[#5b665f]">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
