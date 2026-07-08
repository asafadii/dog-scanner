import { Badge } from "@/components/ui/Badge";
import type { DogAlerts } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Apple,
  DoorOpen,
  Pill,
  Shield,
  type LucideIcon,
} from "lucide-react";

type AlertKey = keyof DogAlerts;

interface AlertDef {
  key: AlertKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  priority: number;
  critical: boolean;
  variant: "red" | "orange" | "rose" | "violet" | "amber";
}

const ALERT_DEFS: AlertDef[] = [
  {
    key: "allergy",
    label: "Allergy",
    shortLabel: "Allergy",
    icon: AlertTriangle,
    priority: 1,
    critical: true,
    variant: "red",
  },
  {
    key: "aggression",
    label: "Aggression caution",
    shortLabel: "Caution",
    icon: Shield,
    priority: 2,
    critical: true,
    variant: "orange",
  },
  {
    key: "escapeRisk",
    label: "Escape risk",
    shortLabel: "Escape",
    icon: DoorOpen,
    priority: 3,
    critical: true,
    variant: "rose",
  },
  {
    key: "medication",
    label: "Medication required",
    shortLabel: "Meds",
    icon: Pill,
    priority: 4,
    critical: false,
    variant: "violet",
  },
  {
    key: "dietary",
    label: "Dietary restriction",
    shortLabel: "Diet",
    icon: Apple,
    priority: 5,
    critical: false,
    variant: "amber",
  },
];

// SOLID safety treatment (PRIM-04 / D-11 / D-14): the 4 safety flags render
// as the loudest element — solid fill + white text + leading icon.
// KEY GOTCHA: the alert key is `escapeRisk` but the token is `safety-escape`.
const SAFETY_SOLID: Record<
  "allergy" | "aggression" | "escapeRisk" | "medication",
  string
> = {
  allergy: "bg-safety-allergy text-white",
  aggression: "bg-safety-aggression text-white",
  escapeRisk: "bg-safety-escape text-white",
  medication: "bg-safety-medication text-white",
};

// Governed off-scale radius/padding per UI-SPEC Spacing Exception
// (rounded-[7px], py-[3px] — do NOT round to 8px/4px; px-2 is on-scale).
const SOLID_CHIP =
  "inline-flex items-center gap-1 rounded-[7px] px-2 py-[3px] text-[13px] font-extrabold";

export function getActiveAlerts(alerts: DogAlerts): AlertDef[] {
  return ALERT_DEFS.filter((def) => alerts[def.key]).sort(
    (a, b) => a.priority - b.priority,
  );
}

export function hasCriticalAlerts(alerts: DogAlerts): boolean {
  return ALERT_DEFS.some((def) => def.critical && alerts[def.key]);
}

interface DogAlertBadgesProps {
  alerts: DogAlerts;
  className?: string;
  compact?: boolean;
}

export function DogAlertBadges({
  alerts,
  className,
  compact = false,
}: DogAlertBadgesProps) {
  const activeAlerts = getActiveAlerts(alerts);

  if (activeAlerts.length === 0) return null;

  const summary = `${activeAlerts.length} care alert${activeAlerts.length > 1 ? "s" : ""}: ${activeAlerts.map((a) => a.label).join(", ")}`;

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="list"
      aria-label="Care alerts"
    >
      <span className="sr-only">{summary}</span>
      {activeAlerts.map(({ key, shortLabel, label, icon: Icon, variant }) => {
        const solid = SAFETY_SOLID[key as keyof typeof SAFETY_SOLID];
        if (solid) {
          return (
            <span
              key={key}
              className={cn(SOLID_CHIP, solid)}
              role="listitem"
              title={label}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              {compact ? shortLabel : label}
            </span>
          );
        }
        return (
          <Badge key={key} variant={variant} role="listitem" title={label}>
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {compact ? shortLabel : label}
          </Badge>
        );
      })}
    </div>
  );
}

export function getCriticalAlertMessages(
  alerts: DogAlerts,
  care: {
    medication: string;
    allergies: string;
    dietaryNotes: string;
    behavior: string;
  },
): { type: string; message: string; critical: boolean }[] {
  const messages: { type: string; message: string; critical: boolean }[] = [];

  if (alerts.allergy && care.allergies !== "None known") {
    messages.push({
      type: "Allergy",
      message: care.allergies,
      critical: true,
    });
  }
  if (alerts.aggression) {
    messages.push({
      type: "Aggression Caution",
      message: care.behavior,
      critical: true,
    });
  }
  if (alerts.escapeRisk) {
    messages.push({
      type: "Escape Risk",
      message: care.behavior,
      critical: true,
    });
  }
  if (alerts.medication && care.medication !== "None") {
    messages.push({
      type: "Medication",
      message: care.medication,
      critical: false,
    });
  }
  if (alerts.dietary) {
    messages.push({
      type: "Dietary Restriction",
      message: care.dietaryNotes,
      critical: false,
    });
  }

  return messages;
}
