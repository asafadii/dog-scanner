import {
  BarChart3,
  Calendar,
  CreditCard,
  Grid3X3,
  LayoutDashboard,
  QrCode,
} from "lucide-react";

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

export default function FeaturesBand() {
  return (
    <section id="features" className="bg-[#FBF3E6] py-[72px]">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="inline-flex items-center rounded-full border-2 border-[#06342F] bg-marker px-[15px] py-2 text-[12.5px] font-extrabold uppercase tracking-[0.03em] text-[#5a4a1e] shadow-sticker-sm">
          Features
        </div>
        <h2 className="mt-[18px] font-display text-[36px] font-extrabold leading-[1.12] tracking-tight text-[#17211D] sm:text-[46px]">
          Everything your team needs, every day
        </h2>
        <div className="mt-11 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => {
            const isMint = index % 2 === 0;
            return (
              <div
                key={title}
                className="rounded-[22px] border-[2.5px] border-[#06342F] bg-white p-7 shadow-sticker-lg transition-transform hover:-translate-y-0.5"
              >
                <span
                  className={`inline-flex h-[54px] w-[54px] items-center justify-center rounded-2xl border-2 border-[#06342F] ${
                    isMint ? "bg-mint" : "bg-marker"
                  }`}
                >
                  <Icon
                    className="h-6 w-6"
                    stroke={isMint ? "#06342F" : "#5a4a1e"}
                    aria-hidden
                  />
                </span>
                <h3 className="mt-[18px] font-display text-[21px] font-bold text-[#17211D]">
                  {title}
                </h3>
                <p className="mt-[7px] text-[15px] leading-relaxed text-[#5b665f]">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
