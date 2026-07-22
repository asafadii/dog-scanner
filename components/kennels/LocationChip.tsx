import { formatLocationLabel } from "@/lib/kennels";
import type { KennelAssignment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface LocationChipProps {
  assignment: KennelAssignment | null;
  className?: string;
}

export function LocationChip({ assignment, className }: LocationChipProps) {
  const label = formatLocationLabel(assignment);
  if (!label) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[7px] px-2 py-[3px] text-[13px] font-extrabold bg-[#06342F] text-white",
        className,
      )}
    >
      <MapPin className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
