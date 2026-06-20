const ROSTER_DOGS = [
  { name: "Biscuit", note: "First Visit", kennel: "A-12" },
  { name: "Mochi", note: "Boarding, Day 2 of stay", kennel: "B-04" },
  { name: "Pepper", note: "Medication", kennel: "C-07" },
  { name: "Nova", note: "Daycare", kennel: "A-03" },
];

export function RosterMockup() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[oklch(0.885_0.000_89.9)] bg-white shadow-lg"
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-[oklch(0.885_0.000_89.9)] px-5 py-4">
        <p className="font-semibold text-[oklch(0.205_0.006_89.9)]">
          In the facility now
        </p>
        <span className="rounded-full bg-[oklch(0.828_0.050_180.2)] px-2.5 py-0.5 text-xs font-semibold text-[oklch(0.531_0.092_185.0)]">
          24 dogs
        </span>
      </div>
      <ul className="divide-y divide-[oklch(0.885_0.000_89.9)]">
        {ROSTER_DOGS.map((dog) => (
          <li
            key={dog.name}
            className="flex items-center justify-between gap-3 px-5 py-3.5"
          >
            <div>
              <p className="text-sm font-semibold text-[oklch(0.205_0.006_89.9)]">
                {dog.name}
              </p>
              <p className="text-xs text-[oklch(0.556_0.000_89.9)]">{dog.note}</p>
            </div>
            <span className="rounded-md border border-[oklch(0.885_0.000_89.9)] px-2 py-0.5 text-xs font-medium text-[oklch(0.556_0.000_89.9)]">
              {dog.kennel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
