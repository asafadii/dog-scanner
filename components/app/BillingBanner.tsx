"use client";

import { useFacilityAccess } from "@/components/app/FacilityAccessContext";
import Link from "next/link";

export function BillingBanner() {
  const { accessLevel, daysUntilBlocked, role } = useFacilityAccess();

  if (accessLevel !== "grace") return null;

  const isAdmin = role === "admin";

  return (
    <div className="w-full bg-danger px-4 py-2.5 text-center text-sm font-medium text-white">
      Your trial has ended and we couldn&apos;t charge your card. You can view
      your data, but can&apos;t add or edit anything until billing is updated.{" "}
      {daysUntilBlocked !== null && (
        <strong>
          {daysUntilBlocked} day{daysUntilBlocked === 1 ? "" : "s"} left before
          full lock.
        </strong>
      )}{" "}
      {isAdmin ? (
        <Link href="/subscription" className="font-semibold underline">
          Update payment →
        </Link>
      ) : (
        <span>Ask a facility admin to update billing.</span>
      )}
    </div>
  );
}
