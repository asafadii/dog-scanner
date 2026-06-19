import { Badge } from "@/components/ui/Badge";
import { formatLocationLabel } from "@/lib/kennels";
import type { KennelAssignment } from "@/lib/types";
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
    <Badge variant="stone" className={className}>
      <MapPin className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}
