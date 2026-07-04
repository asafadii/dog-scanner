import { RosterMockup } from "@/components/landing/RosterMockup";

const SPOTLIGHT_TAGS = [
  { label: "First Visit", primary: true },
  { label: "Medication", primary: false },
  { label: "Transport Required", primary: false },
  { label: "Boarding", primary: false },
  { label: "Daycare", primary: false },
];

export default function OperationsBand() {
  return (
    <div className="border-b-[3px] border-t-[3px] border-[#06342F] bg-[#DBEEE8]">
      <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-6 py-[74px] sm:px-10 lg:grid-cols-2 lg:gap-[52px]">
        <div>
          <div className="inline-block rounded-full border-2 border-[#06342F] bg-white px-3.5 py-1.5 text-[13px] font-extrabold uppercase tracking-[0.06em] text-primary">
            Built for operations
          </div>
          <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[1.04] tracking-tight">
            Built around the dogs, not spreadsheets.
          </h2>
          <p className="mt-5 max-w-[440px] text-[17.5px] font-medium leading-[1.6] text-[#3c524c]">
            Most software focuses on customer databases. DORA focuses on daily
            operations, giving your team a real-time view of every dog currently
            in your facility.
          </p>
          <div className="mt-6 flex flex-wrap gap-[9px]">
            {SPOTLIGHT_TAGS.map((tag) => (
              <span
                key={tag.label}
                className={`rounded-full border-2 border-[#06342F] px-[15px] py-2 text-[13px] font-extrabold ${
                  tag.primary
                    ? "bg-primary text-white"
                    : "bg-white text-[#17211D]"
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
        <RosterMockup />
      </div>
    </div>
  );
}
