import { cn } from "@/lib/utils";
import type { DogStatus } from "@/lib/types";

interface DogStatusBadgeProps {
  status: DogStatus;
  className?: string;
  compact?: boolean;
}

const SOLID_CHIP =
  "inline-flex items-center gap-1 rounded-[7px] px-2 py-[3px] text-[13px] font-extrabold";

export function DogStatusBadge({
  status,
  className,
  compact = false,
}: DogStatusBadgeProps) {
  const isCheckedIn = status === "checked_in";

  return (
    <span
      className={cn(
        SOLID_CHIP,
        "shrink-0",
        isCheckedIn ? "bg-primary text-primary-foreground" : "bg-[#06342F] text-white",
        className,
      )}
      role="status"
      aria-label={isCheckedIn ? "Currently checked in" : "Currently checked out"}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isCheckedIn
            ? "bg-white motion-safe:animate-pulse"
            : "bg-white/70",
        )}
        aria-hidden
      />
      {compact
        ? isCheckedIn
          ? "In"
          : "Out"
        : isCheckedIn
          ? "Checked In"
          : "Checked Out"}
    </span>
  );
}
