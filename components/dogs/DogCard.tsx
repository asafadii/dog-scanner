"use client";

import { DogAlertBadges, hasCriticalAlerts } from "@/components/dogs/DogAlertBadges";
import { DogStatusBadge } from "@/components/dogs/DogStatusBadge";
import { DogVisitBadge } from "@/components/dogs/DogVisitBadge";
import { LocationChip } from "@/components/kennels/LocationChip";
import { MoveKennelPicker } from "@/components/kennels/MoveKennelPicker";
import { CheckoutPicker } from "@/components/payments/CheckoutPicker";
import { Button } from "@/components/ui/Button";
import {
  getEffectiveServiceType,
  updateCheckinServiceType,
} from "@/lib/checkins";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import type { BookingServiceType, Dog, DogStatus, KennelAssignment, Payment } from "@/lib/types";
import { cn, formatCheckInTime } from "@/lib/utils";
import { ArrowRightLeft, Clock, Eye, Loader2, LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DogCardProps {
  dog: Dog;
  onCheckToggle?: (id: string) => void;
  isToggling?: boolean;
  onAssignmentChange?: (dogId: string, assignment: KennelAssignment) => void;
  onCheckoutComplete?: (dogId: string, payment: Payment) => void;
  onServiceTypeChange?: (dogId: string, serviceType: BookingServiceType) => void;
  className?: string;
}

function formatServiceLabel(serviceType: BookingServiceType): string {
  return serviceType === "daycare" ? "Daycare" : "Overnight";
}

function ServiceTypeBadge({
  serviceType,
}: {
  serviceType: BookingServiceType;
}) {
  const isDaycare = serviceType === "daycare";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide",
        isDaycare
          ? // marker = #F2D98A; #5a4a1e = documented marker-text literal (D-04)
            "bg-marker text-[#5a4a1e]"
          : "bg-service-boarding text-white",
      )}
    >
      {formatServiceLabel(serviceType)}
    </span>
  );
}

export function DogCard({
  dog,
  onCheckToggle,
  isToggling = false,
  onAssignmentChange,
  onCheckoutComplete,
  onServiceTypeChange,
  className,
}: DogCardProps) {
  const router = useRouter();
  const [moveOpen, setMoveOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [serviceChangeOpen, setServiceChangeOpen] = useState(false);
  const [serviceChangeLoading, setServiceChangeLoading] = useState(false);
  const [serviceChangeError, setServiceChangeError] = useState<string | null>(null);
  const isCheckedIn = dog.status === "checked_in";
  const critical = hasCriticalAlerts(dog.alerts);
  const storedServiceType = dog.serviceType ?? "daycare";
  // Display-only via shared helper — never written back. Stored boarding stays
  // Overnight; daycare flips to Overnight once 24h have elapsed (§18.3).
  const serviceType =
    isCheckedIn && dog.lastCheckIn
      ? storedServiceType === "boarding"
        ? "boarding"
        : getEffectiveServiceType(dog.lastCheckIn, storedServiceType)
      : storedServiceType;
  const canChangeServiceType = isCheckedIn;
  const alternateServiceType: BookingServiceType =
    storedServiceType === "daycare" ? "boarding" : "daycare";

  async function handleConfirmServiceChange() {
    if (!dog.activeCheckinId) return;

    setServiceChangeLoading(true);
    setServiceChangeError(null);

    const result = await updateCheckinServiceType(
      dog.activeCheckinId,
      alternateServiceType,
    );

    if (result.error) {
      setServiceChangeError(result.error.message);
    } else {
      onServiceTypeChange?.(dog.id, alternateServiceType);
      setServiceChangeOpen(false);
    }

    setServiceChangeLoading(false);
  }

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md",
        critical
          ? "border-danger/40 ring-1 ring-danger/20"
          : "border-border",
        className,
      )}
      aria-label={`${dog.name}, ${dog.breed}, ${isCheckedIn ? "checked in" : "checked out"}`}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          critical
            ? "bg-danger"
            : isCheckedIn
              ? "bg-success"
              : "bg-muted-foreground/40",
        )}
        aria-hidden
      />

      <div className="flex gap-3 pl-2">
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
          <Image
            src={getDogPhotoSrc(dog.photoUrl)}
            alt={`Photo of ${dog.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 72px, 80px"
          />
          <span
            className={cn(
              "absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
              isCheckedIn ? "bg-success" : "bg-muted-foreground",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          {isCheckedIn && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ServiceTypeBadge serviceType={serviceType} />
              {canChangeServiceType && !serviceChangeOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setServiceChangeOpen(true);
                    setServiceChangeError(null);
                  }}
                  className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {serviceChangeOpen && canChangeServiceType && (
            <div className="mb-2 rounded-xl border border-border bg-muted p-3">
              <p className="text-sm font-medium text-foreground">
                Change to {formatServiceLabel(alternateServiceType)}?
              </p>
              {serviceChangeError && (
                <p className="mt-1 text-xs text-danger" role="alert">
                  {serviceChangeError}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleConfirmServiceChange()}
                  disabled={serviceChangeLoading}
                >
                  {serviceChangeLoading ? "Saving..." : "Confirm"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setServiceChangeOpen(false)}
                  disabled={serviceChangeLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold leading-tight text-foreground">
                {dog.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {dog.breed}
                <span aria-hidden> · </span>
                {dog.age}
                <span aria-hidden> · </span>
                <span className="capitalize">{dog.size}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <LocationChip assignment={dog.currentAssignment} />
              <DogStatusBadge status={dog.status} compact />
            </div>
          </div>

          <div className="mt-2.5 min-h-[3.25rem]">
            <DogAlertBadges
              alerts={dog.alerts}
              vaccinationExpiryDate={dog.vaccinationExpiryDate}
              compact
            />
            <DogVisitBadge isReturning={dog.isReturning} compact className="mt-2" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 pl-2 text-sm text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate" title={dog.owner.name}>
            {dog.owner.name}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {isCheckedIn && dog.activeCheckinId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMoveOpen((open) => !open)}
              aria-label={`Move kennel for ${dog.name}`}
              aria-expanded={moveOpen}
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <time
            className="flex items-center gap-1 tabular-nums"
            dateTime={dog.lastCheckIn ?? undefined}
          >
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            {formatCheckInTime(dog.lastCheckIn)}
          </time>
        </div>
      </div>

      {moveOpen && isCheckedIn && dog.activeCheckinId && (
        <div className="mt-3 pl-2">
          <MoveKennelPicker
            checkinId={dog.activeCheckinId}
            onAssigned={(assignment) => {
              onAssignmentChange?.(dog.id, assignment);
              setMoveOpen(false);
            }}
            onClose={() => setMoveOpen(false)}
          />
        </div>
      )}

      {checkoutOpen && isCheckedIn && dog.activeCheckinId && (
        <div className="mt-3 pl-2">
          <CheckoutPicker
            checkinId={dog.activeCheckinId}
            onComplete={(payment) => {
              onCheckoutComplete?.(dog.id, payment);
              setCheckoutOpen(false);
            }}
            onClose={() => setCheckoutOpen(false)}
          />
        </div>
      )}

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
          variant={isCheckedIn ? "danger-soft" : "primary"}
          size="md"
          className="col-span-3"
          disabled={isToggling}
          onClick={() => {
            if (isCheckedIn) {
              setCheckoutOpen((open) => !open);
              setMoveOpen(false);
            } else {
              onCheckToggle?.(dog.id);
            }
          }}
          aria-expanded={isCheckedIn ? checkoutOpen : undefined}
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
