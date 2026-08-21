import { Badge } from "@/components/ui/Badge";
import { getVaccinationExpiryBadgeStatus } from "@/lib/dogs";
import type { DogAlerts } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  DoorOpen,
  Pill,
  Shield,
  Syringe,
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
    key: "chewingRisk",
    label: "Chewing / self-harm risk",
    shortLabel: "Chewing risk",
    icon: DoorOpen,
    priority: 2,
    critical: true,
    variant: "rose",
  },
  {
    key: "aggressionTowardsPeople",
    label: "Aggressive towards people",
    shortLabel: "People caution",
    icon: Shield,
    priority: 3,
    critical: true,
    variant: "orange",
  },
  {
    key: "aggressionTowardsDogs",
    label: "Aggressive towards dogs",
    shortLabel: "Dog caution",
    icon: Shield,
    priority: 4,
    critical: true,
    variant: "orange",
  },
  {
    key: "escapeRisk",
    label: "Escape risk",
    shortLabel: "Escape",
    icon: DoorOpen,
    priority: 5,
    critical: false,
    variant: "amber",
  },
  {
    key: "medication",
    label: "Medication required",
    shortLabel: "Meds",
    icon: Pill,
    priority: 6,
    critical: false,
    variant: "violet",
  },
];

// SOLID safety treatment (PRIM-04 / D-11 / D-14): the 4 critical safety flags
// render as the loudest element — solid fill + white text + leading icon.
const SAFETY_SOLID: Record<
  | "allergy"
  | "chewingRisk"
  | "aggressionTowardsPeople"
  | "aggressionTowardsDogs",
  string
> = {
  allergy: "bg-safety-allergy text-white",
  chewingRisk: "bg-safety-chewing text-white",
  aggressionTowardsPeople: "bg-safety-aggression text-white",
  aggressionTowardsDogs: "bg-safety-aggression text-white",
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
  vaccinationExpiryDate?: string | null;
  className?: string;
  compact?: boolean;
}

export function DogAlertBadges({
  alerts,
  vaccinationExpiryDate,
  className,
  compact = false,
}: DogAlertBadgesProps) {
  const activeAlerts = getActiveAlerts(alerts);
  const vaxStatus = getVaccinationExpiryBadgeStatus(vaccinationExpiryDate);
  const vaxLabel =
    vaxStatus === "expired"
      ? compact
        ? "Vax expired"
        : "Vaccination expired"
      : vaxStatus === "expiring_soon"
        ? compact
          ? "Vax due"
          : "Vaccination expires soon"
        : null;

  if (activeAlerts.length === 0 && !vaxLabel) return null;

  const summaryParts = [
    ...activeAlerts.map((a) => a.label),
    ...(vaxLabel ? [vaxLabel] : []),
  ];
  const summary = `${summaryParts.length} care alert${summaryParts.length > 1 ? "s" : ""}: ${summaryParts.join(", ")}`;

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
      {vaxStatus && vaxLabel ? (
        <Badge
          key="vaccination-expiry"
          variant={vaxStatus === "expired" ? "red" : "amber"}
          role="listitem"
          title={vaxLabel}
        >
          <Syringe className="h-3 w-3 shrink-0" aria-hidden />
          {vaxLabel}
        </Badge>
      ) : null}
    </div>
  );
}

export function getCriticalAlertMessages(
  alerts: DogAlerts,
  notes: {
    allergyNotes: string;
    chewingRiskNotes: string;
    aggressionPeopleNotes: string;
    aggressionDogsNotes: string;
  },
): { type: string; message: string; critical: boolean }[] {
  const messages: { type: string; message: string; critical: boolean }[] = [];

  if (alerts.allergy && notes.allergyNotes) {
    messages.push({
      type: "Allergy",
      message: notes.allergyNotes,
      critical: true,
    });
  }
  if (alerts.chewingRisk && notes.chewingRiskNotes) {
    messages.push({
      type: "Chewing / Self-Harm Risk",
      message: notes.chewingRiskNotes,
      critical: true,
    });
  }
  if (alerts.aggressionTowardsPeople && notes.aggressionPeopleNotes) {
    messages.push({
      type: "Aggression — People",
      message: notes.aggressionPeopleNotes,
      critical: true,
    });
  }
  if (alerts.aggressionTowardsDogs && notes.aggressionDogsNotes) {
    messages.push({
      type: "Aggression — Dogs",
      message: notes.aggressionDogsNotes,
      critical: true,
    });
  }

  return messages;
}
