"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  createKennel,
  getAllKennels,
  INCOMPLETE_SETUP_MESSAGE,
  updateKennel,
} from "@/lib/kennels";
import type { Kennel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Home, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function KennelsSettingsSection() {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState(1);
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; capacity: number }>
  >({});
  const newNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const loadKennels = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getAllKennels();
    if (result.error) {
      setError(result.error.message);
      setKennels([]);
      setDrafts({});
    } else {
      setKennels(result.data);
      setDrafts(
        Object.fromEntries(
          result.data.map((kennel) => [
            kennel.id,
            { name: kennel.name, capacity: kennel.capacity },
          ]),
        ),
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadKennels();
  }, [loadKennels]);

  async function handleAddKennel() {
    setAdding(true);
    setError(null);
    setSuccess(null);

    const result = await createKennel(newName, newCapacity);
    if (result.error) {
      setError(result.error.message);
    } else {
      setKennels((prev) =>
        [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDrafts((prev) => ({
        ...prev,
        [result.data.id]: {
          name: result.data.name,
          capacity: result.data.capacity,
        },
      }));
      setNewName("");
      setNewCapacity(1);
      setSuccess(`Added kennel ${result.data.name}.`);
      newNameInputRef.current?.focus();
    }

    setAdding(false);
  }

  async function handleSaveKennel(kennel: Kennel) {
    const draft = drafts[kennel.id];
    if (!draft) return;

    setSavingId(kennel.id);
    setError(null);
    setSuccess(null);

    const result = await updateKennel(kennel.id, {
      name: draft.name,
      capacity: draft.capacity,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setKennels((prev) =>
        prev
          .map((item) => (item.id === kennel.id ? result.data : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDrafts((prev) => ({
        ...prev,
        [kennel.id]: {
          name: result.data.name,
          capacity: result.data.capacity,
        },
      }));
      setSuccess(`Saved ${result.data.name}.`);
    }

    setSavingId(null);
  }

  async function handleToggleActive(kennel: Kennel) {
    setSavingId(kennel.id);
    setError(null);
    setSuccess(null);

    const result = await updateKennel(kennel.id, {
      isActive: !kennel.isActive,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setKennels((prev) =>
        prev.map((item) => (item.id === kennel.id ? result.data : item)),
      );
      setSuccess(
        result.data.isActive
          ? `${result.data.name} is active again.`
          : `${result.data.name} marked inactive.`,
      );
    }

    setSavingId(null);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="h-5 w-5 text-primary" aria-hidden />
          Kennels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Configure kennel spaces for placement during check-in. Inactive kennels
          stay in history but cannot be assigned.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading kennels...
          </div>
        ) : (
          <>
            {error && (
              <div
                className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {/* #FEF2F2 documented error-tint (D-04, mirrors Alert.tsx) */}
                {error}
              </div>
            )}

            {success && (
              <div
                className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
                role="status"
              >
                {/* #ECFDF5 documented success-tint (D-04, mirrors Alert.tsx) */}
                {success}
              </div>
            )}

            {kennels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No kennels yet.</p>
            ) : (
              <div className="space-y-3">
                {kennels.map((kennel) => {
                  const draft = drafts[kennel.id];
                  const isSaving = savingId === kennel.id;

                  return (
                    <div
                      key={kennel.id}
                      className={cn(
                        "rounded-xl border p-4",
                        kennel.isActive
                          ? "border-border bg-surface"
                          : "border-border bg-muted opacity-80",
                      )}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Name"
                          value={draft?.name ?? kennel.name}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [kennel.id]: {
                                name: e.target.value,
                                capacity:
                                  prev[kennel.id]?.capacity ?? kennel.capacity,
                              },
                            }))
                          }
                          disabled={isSaving}
                        />
                        <Input
                          label="Capacity"
                          type="number"
                          min={1}
                          value={draft?.capacity ?? kennel.capacity}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [kennel.id]: {
                                name: prev[kennel.id]?.name ?? kennel.name,
                                capacity: Number(e.target.value),
                              },
                            }))
                          }
                          disabled={isSaving}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => void handleSaveKennel(kennel)}
                          disabled={isSaving || !draft}
                        >
                          {isSaving && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void handleToggleActive(kennel)}
                          disabled={isSaving}
                        >
                          {kennel.isActive ? "Mark Inactive" : "Mark Active"}
                        </Button>
                        {!kennel.isActive && (
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-border p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                Add Kennel
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  ref={newNameInputRef}
                  label="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="K1"
                  disabled={adding}
                />
                <Input
                  label="Capacity"
                  type="number"
                  min={1}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  disabled={adding}
                />
              </div>
              <Button
                className="mt-3 w-full sm:w-auto"
                onClick={() => void handleAddKennel()}
                disabled={adding || !newName.trim() || writeLocked}
                title={writeLocked ? WRITE_LOCKED_TITLE : undefined}
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                {adding ? "Adding..." : "Add Kennel"}
              </Button>
            </div>

            {error === INCOMPLETE_SETUP_MESSAGE && (
              <p className="text-sm text-muted-foreground">
                Complete account setup before configuring kennels.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
