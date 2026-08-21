"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import { AssignPassDialog } from "@/components/passes/AssignPassDialog";
import { DogCard } from "@/components/dogs/DogCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getClientById,
  getClientDogs,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/clients";
import { listClientPasses } from "@/lib/passes";
import type {
  Client,
  ClientPassDisplayStatus,
  ClientPassListItem,
  Dog,
} from "@/lib/types";
import { cn, formatBookingDate } from "@/lib/utils";
import {
  ChevronDown,
  Loader2,
  Mail,
  MapPin,
  PawPrint,
  Pencil,
  Phone,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ClientDetailViewProps {
  clientId: string;
}

const PASS_STATUS_BADGE: Record<
  ClientPassDisplayStatus,
  { label: string; variant: "teal" | "amber" | "red" | "stone" }
> = {
  active: { label: "Active", variant: "teal" },
  expiring_soon: { label: "Expiring soon", variant: "amber" },
  expired: { label: "Expired", variant: "red" },
  exhausted: { label: "Exhausted", variant: "red" },
  cancelled: { label: "Cancelled", variant: "stone" },
};

function isActivePassDisplay(status: ClientPassDisplayStatus): boolean {
  return status === "active" || status === "expiring_soon";
}

function ClientPassRow({
  pass,
  muted = false,
}: {
  pass: ClientPassListItem;
  muted?: boolean;
}) {
  const remaining = Math.max(0, pass.occasionsTotal - pass.occasionsUsed);
  const status = PASS_STATUS_BADGE[pass.displayStatus];

  return (
    <li
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3",
        muted && "opacity-60",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-semibold text-foreground",
            muted && "line-through",
          )}
        >
          {pass.passTypeName}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {remaining} of {pass.occasionsTotal} remaining
          {" · "}
          Expires {formatBookingDate(pass.expiryDate)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Badge variant={pass.serviceType === "daycare" ? "teal" : "violet"}>
          {pass.serviceType === "daycare" ? "Daycare" : "Boarding"}
        </Badge>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </li>
  );
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const [client, setClient] = useState<Client | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [passes, setPasses] = useState<ClientPassListItem[]>([]);
  const [passesError, setPassesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [clientResult, dogsResult, passesResult] = await Promise.all([
      getClientById(clientId),
      getClientDogs(clientId),
      listClientPasses(clientId),
    ]);

    if (clientResult.error) {
      setError(clientResult.error.message);
      setClient(null);
      setDogs([]);
      setPasses([]);
      setPassesError(null);
    } else {
      setClient(clientResult.data);
      setDogs(dogsResult.error ? [] : dogsResult.data);
      if (passesResult.error) {
        setPasses([]);
        setPassesError(passesResult.error.message);
      } else {
        setPasses(passesResult.data);
        setPassesError(null);
      }
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-danger" role="alert">
          {error ?? "Client not found"}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadClient()}>
            Try again
          </Button>
        )}
        <div>
          <Link
            href="/clients"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  const activePasses = passes.filter((pass) =>
    isActivePassDisplay(pass.displayStatus),
  );
  const inactivePasses = passes.filter(
    (pass) => !isActivePassDisplay(pass.displayStatus),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <User className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {client.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dogs.length} {dogs.length === 1 ? "dog" : "dogs"} on file
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {writeLocked ? (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled
              title={WRITE_LOCKED_TITLE}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Client
            </Button>
          ) : (
            <Link href={`/clients/${clientId}/edit`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <Pencil className="h-4 w-4" aria-hidden />
                Edit Client
              </Button>
            </Link>
          )}
          {writeLocked ? (
            <Button
              className="w-full sm:w-auto"
              disabled
              title={WRITE_LOCKED_TITLE}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add Dog
            </Button>
          ) : (
            <Link href={`/dogs/new?clientId=${clientId}`}>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" aria-hidden />
                Add Dog
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" aria-hidden />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {client.phone && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden />
                Phone
              </span>
              <a
                href={`tel:${client.phone}`}
                className="font-medium text-primary hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                Email
              </span>
              <a
                href={`mailto:${client.email}`}
                className="font-medium text-primary hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                Address
              </span>
              <span className="max-w-[60%] text-right font-medium text-foreground">
                {client.address}
              </span>
            </div>
          )}
          {client.emergencyContact && (
            <div className="border-t border-border pt-3">
              <p className="text-muted-foreground">Emergency Contact</p>
              <p className="mt-1 font-medium text-foreground">
                {client.emergencyContact}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-base">Passes</CardTitle>
          {writeLocked ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              title={WRITE_LOCKED_TITLE}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Assign Pass
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Assign Pass
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {passesError ? (
            <p className="text-sm text-danger" role="alert">
              {passesError}
            </p>
          ) : passes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No passes assigned yet.
            </p>
          ) : (
            <>
              {activePasses.length > 0 ? (
                <ul className="space-y-2">
                  {activePasses.map((pass) => (
                    <ClientPassRow key={pass.id} pass={pass} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active passes.
                </p>
              )}
              {inactivePasses.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setInactiveOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-2 py-1 text-left text-sm font-medium text-muted-foreground"
                    aria-expanded={inactiveOpen}
                  >
                    Inactive passes ({inactivePasses.length})
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        inactiveOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {inactiveOpen && (
                    <ul className="mt-2 space-y-2">
                      {inactivePasses.map((pass) => (
                        <ClientPassRow key={pass.id} pass={pass} muted />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {client.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-foreground">
            <p className="whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Dogs</h3>
        {dogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border border-t-4 border-t-marker bg-surface py-12 text-center">
            <div className="mx-auto mb-3 flex w-fit rounded-xl bg-marker/20 p-3 text-[#5a4a1e]">
              <PawPrint className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-muted-foreground">No dogs linked to this client yet.</p>
            {writeLocked ? (
              <Button
                variant="outline"
                className="mt-4"
                disabled
                title={WRITE_LOCKED_TITLE}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Dog
              </Button>
            ) : (
              <Link href={`/dogs/new?clientId=${clientId}`}>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4" aria-hidden />
                  Add Dog
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div
            className={cn("grid gap-4", dogs.length > 1 && "sm:grid-cols-2")}
          >
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}
      </div>

      <AssignPassDialog
        open={assignOpen}
        clientId={clientId}
        writeLocked={writeLocked}
        writeLockedTitle={WRITE_LOCKED_TITLE}
        onClose={() => setAssignOpen(false)}
        onAssigned={(pass) => {
          setPasses((current) => [pass, ...current]);
          setPassesError(null);
          setAssignOpen(false);
        }}
      />
    </div>
  );
}
