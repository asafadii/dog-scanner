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

const STEP_FILLS = [
  "bg-primary text-white",
  "bg-mint text-[#06342F]",
  "bg-marker text-[#5a4a1e]",
  "bg-mint text-[#06342F]",
  "bg-primary text-white",
];

export default function HowItWorksBand() {
  return (
    <section id="how-it-works" className="bg-[#FBF3E6] py-[72px]">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="inline-flex items-center rounded-full border-2 border-[#06342F] bg-marker px-[15px] py-2 text-[12.5px] font-extrabold uppercase tracking-[0.03em] text-[#5a4a1e] shadow-sticker-sm">
          How it works
        </div>
        <h2 className="mt-[18px] font-display text-[36px] font-extrabold leading-[1.12] tracking-tight text-[#17211D] sm:text-[46px]">
          From booking to checkout in five steps
        </h2>
        <ol className="mt-11 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.number}>
              <span
                className={`inline-flex h-[62px] w-[62px] items-center justify-center rounded-full border-[3px] border-[#06342F] font-display text-[21px] font-extrabold shadow-sticker ${STEP_FILLS[index]}`}
              >
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-[18px] font-bold text-[#17211D]">
                {step.title}
              </h3>
              <p className="mt-[6px] text-[14px] leading-relaxed text-[#5b665f]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
