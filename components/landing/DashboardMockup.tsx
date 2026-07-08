const STATS = [
  { label: "Checked in", value: "24", tile: "bg-mint-wash", num: "text-[#06342F]", lab: "text-[#045C54]" },
  { label: "Arrivals", value: "9", tile: "bg-[#F7E9C4]", num: "text-[#5a4a1e]", lab: "text-[#5a4a1e]" },
  { label: "Boarding", value: "6", tile: "bg-primary", num: "text-white", lab: "text-[#bfe9e1]" },
];

const DOGS = [
  { name: "Max", breed: "Golden Retriever", kennel: "A-12" },
  { name: "Luna", breed: "Border Collie", kennel: "B-04" },
  { name: "Rocky", breed: "Pit Bull Mix", kennel: "C-07" },
];

function PawIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 28 28" fill="#077D73" aria-hidden>
      <ellipse cx="14" cy="18.5" rx="6.6" ry="5.6" />
      <circle cx="5.6" cy="12" r="2.5" />
      <circle cx="10.6" cy="7.4" r="2.6" />
      <circle cx="17.4" cy="7.4" r="2.6" />
      <circle cx="22.4" cy="12" r="2.5" />
    </svg>
  );
}

export function DashboardMockup() {
  return (
    <div
      className="rounded-[22px] border-[3px] border-[#06342F] bg-white p-[18px] shadow-sticker-xl"
      aria-hidden
    >
      <div className="grid grid-cols-3 gap-2.5">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-[13px] border-2 border-[#06342F] p-3 ${stat.tile}`}
          >
            <p className={`text-[11.5px] font-bold ${stat.lab}`}>{stat.label}</p>
            <p
              className={`font-display text-[30px] font-extrabold leading-[1.1] ${stat.num}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mx-0.5 mb-2 mt-[15px] text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary">
        Checked in now
      </p>

      <div className="flex flex-col gap-[9px]">
        {DOGS.map((dog) => (
          <div
            key={dog.name}
            className="flex items-center gap-[11px] rounded-[13px] border-2 border-[#06342F] p-2.5"
          >
            <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-mint-wash">
              <PawIcon />
            </span>
            <span className="flex-1">
              <span className="block text-[14.5px] font-extrabold">{dog.name}</span>
              <span className="block text-[12.5px] text-[#8a9089]">{dog.breed}</span>
            </span>
            <span className="rounded-[7px] bg-primary px-[9px] py-1 text-[12px] font-extrabold text-white">
              {dog.kennel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
