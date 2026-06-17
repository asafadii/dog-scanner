import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: "amber" | "teal" | "red" | "stone" }
> = {
  pending: { label: "Pending", variant: "amber" },
  approved: { label: "Approved", variant: "teal" },
  rejected: { label: "Rejected", variant: "red" },
  completed: { label: "Completed", variant: "stone" },
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn("shrink-0 capitalize", className)}
      role="status"
      aria-label={`Booking status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
