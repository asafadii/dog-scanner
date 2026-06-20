const STATS = [
  { label: "Checked in", value: "24" },
  { label: "Arrivals today", value: "9" },
  { label: "Boarding", value: "6" },
];

const DOGS = [
  { name: "Biscuit", breed: "Golden Retriever", kennel: "A-12" },
  { name: "Mochi", breed: "Shiba Inu", kennel: "B-04" },
  { name: "Pepper", breed: "Border Collie", kennel: "C-07" },
];

export function DashboardMockup() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[oklch(0.885_0.000_89.9)] bg-white shadow-xl shadow-[oklch(0.531_0.092_185.0/0.08)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-[oklch(0.885_0.000_89.9)] bg-[oklch(0.985_0_0)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.885_0.000_89.9)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.885_0.000_89.9)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.885_0.000_89.9)]" />
        <div className="ml-3 h-6 flex-1 rounded-md bg-[oklch(0.885_0.000_89.9/0.6)]" />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[oklch(0.885_0.000_89.9)] bg-[oklch(0.985_0_0)] p-3"
            >
              <p className="text-xs text-[oklch(0.556_0.000_89.9)]">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[oklch(0.205_0.006_89.9)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[oklch(0.885_0.000_89.9)]">
          <div className="border-b border-[oklch(0.885_0.000_89.9)] px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[oklch(0.556_0.000_89.9)]">
              Checked in now
            </p>
          </div>
          <ul className="divide-y divide-[oklch(0.885_0.000_89.9)]">
            {DOGS.map((dog) => (
              <li
                key={dog.name}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[oklch(0.205_0.006_89.9)]">
                    {dog.name}
                  </p>
                  <p className="text-xs text-[oklch(0.556_0.000_89.9)]">
                    {dog.breed}
                  </p>
                </div>
                <span className="rounded-md bg-[oklch(0.828_0.050_180.2)] px-2 py-0.5 text-xs font-medium text-[oklch(0.531_0.092_185.0)]">
                  {dog.kennel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
