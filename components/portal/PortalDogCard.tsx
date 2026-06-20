"use client";

import { DogStatusBadge } from "@/components/dogs/DogStatusBadge";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import type { Dog } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface PortalDogCardProps {
  dog: Dog;
  clientId: string;
  facilityId: string;
  className?: string;
}

export function PortalDogCard({
  dog,
  clientId,
  facilityId,
  className,
}: PortalDogCardProps) {
  const href = `/portal/dogs/${dog.id}?clientId=${encodeURIComponent(clientId)}&facilityId=${encodeURIComponent(facilityId)}`;

  return (
    <Link
      href={href}
      className={cn(
        "block overflow-hidden rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      aria-label={`View ${dog.name}`}
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50">
          <Image
            src={getDogPhotoSrc(dog.photoUrl)}
            alt={`Photo of ${dog.name}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-stone-900">
                {dog.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-stone-500">
                {dog.breed}
                <span aria-hidden> · </span>
                <span className="capitalize">{dog.size}</span>
              </p>
            </div>
            <DogStatusBadge status={dog.status} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}
