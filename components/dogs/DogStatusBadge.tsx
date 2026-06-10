import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { DogStatus } from "@/lib/types";

interface DogStatusBadgeProps {
  status: DogStatus;
  className?: string;
  compact?: boolean;
}

export function DogStatusBadge({
  status,
  className,
  compact = false,
}: DogStatusBadgeProps) {
  const isCheckedIn = status === "checked_in";

  return (
    <Badge
      variant={isCheckedIn ? "teal" : "stone"}
      className={cn("shrink-0", className)}
      role="status"
      aria-label={isCheckedIn ? "Currently checked in" : "Currently checked out"}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isCheckedIn ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-stone-400",
        )}
        aria-hidden
      />
      {compact ? (isCheckedIn ? "In" : "Out") : isCheckedIn ? "Checked In" : "Checked Out"}
    </Badge>
  );
}
