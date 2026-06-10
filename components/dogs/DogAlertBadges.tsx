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
      {activeAlerts.map(
        ({ key, shortLabel, label, icon: Icon, variant }) => (
          <Badge key={key} variant={variant} role="listitem" title={label}>
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {compact ? shortLabel : label}
          </Badge>
        ),
      )}
    </div>
  );
}

export function getCriticalAlertMessages(
  alerts: DogAlerts,
  care: { medication: string; allergies: string; feeding: string; behavior: string },
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
      message: care.feeding,
      critical: false,
    });
  }

  return messages;
}
