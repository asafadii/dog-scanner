const ROSTER_DOGS = [
  { name: "Max", note: "Medication", noteClass: "text-primary font-bold", kennel: "A-12" },
  { name: "Luna", note: "Boarding · Day 2", noteClass: "text-[#8a9089]", kennel: "B-04" },
  { name: "Rocky", note: "Daycare", noteClass: "text-[#8a9089]", kennel: "C-07" },
];

function PawIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="#06342F" aria-hidden>
      <ellipse cx="14" cy="18.5" rx="6.6" ry="5.6" />
      <circle cx="5.6" cy="12" r="2.5" />
      <circle cx="10.6" cy="7.4" r="2.6" />
      <circle cx="17.4" cy="7.4" r="2.6" />
      <circle cx="22.4" cy="12" r="2.5" />
    </svg>
  );
}

export function RosterMockup() {
  return (
    <div
      className="rounded-[22px] border-[3px] border-[#06342F] bg-white p-2.5 shadow-sticker-xl"
      aria-hidden
    >
      <div className="flex items-center justify-between px-4 pb-[11px] pt-[15px]">
        <span className="font-display text-[19px] font-bold">In the facility now</span>
        <span className="rounded-full border-2 border-[#06342F] bg-primary px-3 py-1.5 text-[12.5px] font-extrabold text-white">
          24 dogs
        </span>
      </div>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        {ROSTER_DOGS.map((dog) => (
          <div
            key={dog.name}
            className="flex items-center gap-3 rounded-[13px] border-2 border-[#06342F] p-[11px]"
          >
            <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-2 border-[#06342F] bg-mint">
              <PawIcon />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-extrabold">{dog.name}</span>
              <span className={`block text-[13px] ${dog.noteClass}`}>{dog.note}</span>
            </span>
            <span className="rounded-lg border-[1.5px] border-[#06342F] bg-[#F7E9C4] px-2.5 py-[5px] text-[12.5px] font-extrabold text-[#17211D]">
              {dog.kennel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
