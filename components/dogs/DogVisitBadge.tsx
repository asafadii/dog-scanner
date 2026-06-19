import { Badge } from "@/components/ui/Badge";
import { History, Sparkles } from "lucide-react";

interface DogVisitBadgeProps {
  isReturning: boolean;
  compact?: boolean;
  className?: string;
}

export function DogVisitBadge({
  isReturning,
  compact = false,
  className,
}: DogVisitBadgeProps) {
  if (isReturning) {
    return (
      <Badge variant="teal" className={className} title="Returning dog">
        <History className="h-3 w-3 shrink-0" aria-hidden />
        {compact ? "Returning" : "Returning Dog"}
      </Badge>
    );
  }

  return (
    <Badge variant="violet" className={className} title="First visit">
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
      First Visit
    </Badge>
  );
}
