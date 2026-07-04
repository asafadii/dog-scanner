"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { assignLocation, getKennels } from "@/lib/kennels";
import type { Kennel, KennelAssignment, LocationType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const LOCATION_OPTIONS: { value: LocationType; label: string }[] = [
  { value: "kennel", label: "Kennel" },
  { value: "daycare", label: "Daycare" },
  { value: "grooming", label: "Grooming" },
  { value: "isolation", label: "Isolation" },
];

interface MoveKennelPickerProps {
  checkinId: string;
  onAssigned: (assignment: KennelAssignment) => void;
  onClose: () => void;
  className?: string;
}

export function MoveKennelPicker({
  checkinId,
  onAssigned,
  onClose,
  className,
}: MoveKennelPickerProps) {
  const [locationType, setLocationType] = useState<LocationType>("kennel");
  const [kennelId, setKennelId] = useState("");
  const [notes, setNotes] = useState("");
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [loadingKennels, setLoadingKennels] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKennels = useCallback(async () => {
    setLoadingKennels(true);
    const result = await getKennels();
    if (result.error) {
      setError(result.error.message);
      setKennels([]);
    } else {
      setKennels(result.data);
      if (result.data.length > 0) {
        setKennelId((current) => current || result.data[0].id);
      }
    }
    setLoadingKennels(false);
  }, []);

  useEffect(() => {
    void loadKennels();
  }, [loadKennels]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const result = await assignLocation(checkinId, {
      locationType,
      kennelId: locationType === "kennel" ? kennelId : null,
      notes: notes.trim() || null,
    });

    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    onAssigned(result.data);
    onClose();
    setSubmitting(false);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Move Kennel</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close move kennel picker"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        // #FEF2F2 = documented Alert error tint (Alert.tsx precedent, D-04)
        <div
          className="mb-3 rounded-lg border border-danger/25 bg-[#FEF2F2] px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor={`move-location-${checkinId}`}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Location
          </label>
          <select
            id={`move-location-${checkinId}`}
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as LocationType)}
            disabled={submitting}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {locationType === "kennel" && (
          <div>
            <label
              htmlFor={`move-kennel-${checkinId}`}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Kennel
            </label>
            {loadingKennels ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading kennels...
              </div>
            ) : kennels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active kennels configured. Add kennels in Settings.
              </p>
            ) : (
              <select
                id={`move-kennel-${checkinId}`}
                value={kennelId}
                onChange={(e) => setKennelId(e.target.value)}
                disabled={submitting}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {kennels.map((kennel) => (
                  <option key={kennel.id} value={kennel.id}>
                    {kennel.name} (cap. {kennel.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          placeholder="Reason for move..."
        />

        <Button
          className="w-full"
          onClick={() => void handleSubmit()}
          disabled={
            submitting ||
            (locationType === "kennel" &&
              (loadingKennels || kennels.length === 0 || !kennelId))
          }
        >
          {submitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {submitting ? "Assigning..." : "Assign Location"}
        </Button>
      </div>
    </div>
  );
}
