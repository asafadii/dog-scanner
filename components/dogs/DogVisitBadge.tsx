import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
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
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-[7px] border border-[#e8c84a] bg-marker px-2 py-[3px] text-[13px] font-extrabold text-[#5a4a1e]",
          className,
        )}
        title="Returning dog"
      >
        <History className="h-3 w-3 shrink-0" aria-hidden />
        {compact ? "Returning" : "Returning Dog"}
      </span>
    );
  }

  return (
    <Badge variant="violet" className={className} title="First visit">
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
      First Visit
    </Badge>
  );
}
