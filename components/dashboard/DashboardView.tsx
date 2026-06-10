"use client";

import { DogCard } from "@/components/dogs/DogCard";
import { Card, CardContent } from "@/components/ui/Card";
import { getDashboardStats } from "@/lib/mockData";
import { useMockStore } from "@/lib/mockStore";
import {
  ClipboardCheck,
  Moon,
  PawPrint,
  Pill,
} from "lucide-react";
import Link from "next/link";

const STAT_CONFIG = [
  {
    key: "checkedIn" as const,
    label: "Checked In",
    icon: ClipboardCheck,
    color: "text-emerald-600 bg-emerald-50",
    href: "/checkins",
  },
  {
    key: "needMedication" as const,
    label: "Need Medication",
    icon: Pill,
    color: "text-violet-600 bg-violet-50",
    href: "/dogs",
  },
  {
    key: "overnight" as const,
    label: "Overnight Stays",
    icon: Moon,
    color: "text-amber-600 bg-amber-50",
    href: "/checkins",
  },
  {
    key: "total" as const,
    label: "Total Dogs",
    icon: PawPrint,
    color: "text-teal-600 bg-teal-50",
    href: "/dogs",
  },
];

export function DashboardView() {
  const { dogs, toggleCheckStatus } = useMockStore();
  const stats = getDashboardStats(dogs);
  const checkedInDogs = dogs.filter((d) => d.status === "checked_in").slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Good morning!
        </h2>
        <p className="mt-1 text-stone-500">
          Here&apos;s what&apos;s happening at the facility today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, href }) => (
          <Link key={key} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-2xl font-bold tabular-nums text-stone-900">
                  {stats[key]}
                </p>
                <p className="text-sm text-stone-500">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">
            Currently Checked In
          </h3>
          <Link
            href="/checkins"
            className="text-sm font-medium text-teal-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {checkedInDogs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-stone-500">
              No dogs checked in right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checkedInDogs.map((dog) => (
              <DogCard
                key={dog.id}
                dog={dog}
                onCheckToggle={toggleCheckStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
