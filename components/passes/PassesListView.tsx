"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { PassTypeFormDialog } from "@/components/passes/PassTypeFormDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatAmount } from "@/lib/currency";
import { getFacilitySettings } from "@/lib/facility";
import { INCOMPLETE_SETUP_MESSAGE } from "@/lib/dogs";
import {
  getPassTypeAssignmentCounts,
  listPassTypes,
} from "@/lib/passes";
import type { PassType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Ticket } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function PassesListView() {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [passTypes, setPassTypes] = useState<PassType[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PassType | null>(null);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [typesResult, countsResult, facilityResult] = await Promise.all([
      listPassTypes(),
      getPassTypeAssignmentCounts(),
      getFacilitySettings(),
    ]);

    if (!facilityResult.error) {
      setCurrency(facilityResult.data.currency);
    }

    if (typesResult.error) {
      setError(typesResult.error.message);
      setPassTypes([]);
      setAssignmentCounts({});
    } else {
      setPassTypes(typesResult.data);
      setAssignmentCounts(
        countsResult.error ? {} : countsResult.data,
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPasses();
  }, [loadPasses]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(passType: PassType) {
    setEditing(passType);
    setFormOpen(true);
  }

  function handleSaved(saved: PassType) {
    setPassTypes((current) => {
      const exists = current.some((item) => item.id === saved.id);
      const next = exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return [...next].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    });
    setFormOpen(false);
    setEditing(null);
  }

  function handleDeactivated(saved: PassType) {
    setPassTypes((current) =>
      [...current.map((item) => (item.id === saved.id ? saved : item))].sort(
        (a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return a.name.localeCompare(b.name);
        },
      ),
    );
    setFormOpen(false);
    setEditing(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading passes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger/10 px-6 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void loadPasses()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Passes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create pass types and see how they&apos;re being used.
          </p>
        </div>
        {writeLocked ? (
          <Button
            className="w-full sm:w-auto"
            disabled
            title={WRITE_LOCKED_TITLE}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Pass Type
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            New Pass Type
          </Button>
        )}
      </div>

      {passTypes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-12 text-center">
          <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
            <Ticket className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-muted-foreground">
            No pass types yet. Create your first pass to start selling
            daycare/boarding bundles.
          </p>
          {writeLocked ? (
            <Button
              variant="outline"
              className="mt-4"
              disabled
              title={WRITE_LOCKED_TITLE}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New Pass Type
            </Button>
          ) : (
            <Button variant="outline" className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              New Pass Type
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {passTypes.map((passType) => {
            const assigned = assignmentCounts[passType.id] ?? 0;
            return (
              <Card
                key={passType.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(passType)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openEdit(passType);
                  }
                }}
                className={cn(
                  "h-full cursor-pointer transition-shadow hover:shadow-md",
                  !passType.isActive && "opacity-60",
                )}
              >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg">{passType.name}</CardTitle>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        <Badge
                          variant={
                            passType.serviceType === "daycare"
                              ? "teal"
                              : "violet"
                          }
                        >
                          {passType.serviceType === "daycare"
                            ? "Daycare"
                            : "Boarding"}
                        </Badge>
                        {!passType.isActive && (
                          <Badge variant="stone">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
                    <p className="text-base font-semibold tabular-nums text-foreground">
                      {formatAmount(passType.price, currency)}
                    </p>
                    <p>
                      {passType.occasions}{" "}
                      {passType.occasions === 1 ? "occasion" : "occasions"}
                    </p>
                    <p>
                      Assigned to {assigned}{" "}
                      {assigned === 1 ? "client" : "clients"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <PassTypeFormDialog
        open={formOpen}
        passType={editing}
        currency={currency}
        writeLocked={writeLocked}
        writeLockedTitle={WRITE_LOCKED_TITLE}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        onDeactivated={handleDeactivated}
      />
    </div>
  );
}
