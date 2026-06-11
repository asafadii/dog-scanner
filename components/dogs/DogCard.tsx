"use client";

import { DogAlertBadges, hasCriticalAlerts } from "@/components/dogs/DogAlertBadges";
import { DogStatusBadge } from "@/components/dogs/DogStatusBadge";
import { Button } from "@/components/ui/Button";
import type { Dog, DogStatus } from "@/lib/types";
import { cn, formatCheckInTime } from "@/lib/utils";
import { Clock, Eye, Loader2, LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface DogCardProps {
  dog: Dog;
  onCheckToggle?: (id: string) => void;
  isToggling?: boolean;
  className?: string;
}

export function DogCard({
  dog,
  onCheckToggle,
  isToggling = false,
  className,
}: DogCardProps) {
  const router = useRouter();
  const isCheckedIn = dog.status === "checked_in";
  const critical = hasCriticalAlerts(dog.alerts);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        critical
          ? "border-red-200 ring-1 ring-red-100"
          : "border-stone-200/80",
        className,
      )}
      aria-label={`${dog.name}, ${dog.breed}, ${isCheckedIn ? "checked in" : "checked out"}`}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          critical
            ? "bg-red-400"
            : isCheckedIn
              ? "bg-emerald-400"
              : "bg-stone-300",
        )}
        aria-hidden
      />

      <div className="flex gap-3 pl-2">
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-20 sm:w-20">
          {dog.photoUrl ? (
            <Image
              src={dog.photoUrl}
              alt={`Photo of ${dog.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 72px, 80px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-amber-50 text-xl font-bold text-teal-700"
              aria-hidden
            >
              {dog.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className={cn(
              "absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
              isCheckedIn ? "bg-emerald-500" : "bg-stone-400",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold leading-tight text-stone-900">
                {dog.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-stone-500">
                {dog.breed}
                <span aria-hidden> · </span>
                {dog.age}
                <span aria-hidden> · </span>
                <span className="capitalize">{dog.size}</span>
              </p>
            </div>
            <DogStatusBadge status={dog.status} compact />
          </div>

          <DogAlertBadges
            alerts={dog.alerts}
            compact
            className="mt-2.5"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 pl-2 text-sm text-stone-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <User className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
          <span className="truncate" title={dog.owner.name}>
            {dog.owner.name}
          </span>
        </span>
        <time
          className="flex shrink-0 items-center gap-1 tabular-nums"
          dateTime={dog.lastCheckIn ?? undefined}
        >
          <Clock className="h-4 w-4 text-stone-400" aria-hidden />
          {formatCheckInTime(dog.lastCheckIn)}
        </time>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2 pl-2">
        <Button
          variant="outline"
          size="md"
          className="col-span-2"
          onClick={() => router.push(`/dogs/${dog.id}`)}
          aria-label={`View profile for ${dog.name}`}
        >
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          Profile
        </Button>
        <Button
          variant={isCheckedIn ? "danger" : "primary"}
          size="md"
          className="col-span-3"
          disabled={isToggling}
          onClick={() => onCheckToggle?.(dog.id)}
          aria-label={
            isCheckedIn ? `Check out ${dog.name}` : `Check in ${dog.name}`
          }
        >
          {isToggling ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              {isCheckedIn ? "Checking out..." : "Checking in..."}
            </>
          ) : isCheckedIn ? (
            <>
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Check Out
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 shrink-0" aria-hidden />
              Check In
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

export type { DogStatus };
