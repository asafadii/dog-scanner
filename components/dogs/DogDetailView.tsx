"use client";

import {
  useFacilityAccess,
  WRITE_LOCKED_TITLE,
} from "@/components/app/FacilityAccessContext";
import {
  DogAlertBadges,
  getActiveAlerts,
  getCriticalAlertMessages,
  hasCriticalAlerts,
} from "@/components/dogs/DogAlertBadges";
import { DogStatusBadge } from "@/components/dogs/DogStatusBadge";
import { DogVisitBadge } from "@/components/dogs/DogVisitBadge";
import { LocationChip } from "@/components/kennels/LocationChip";
import { MoveKennelPicker } from "@/components/kennels/MoveKennelPicker";
import { CheckoutPicker } from "@/components/payments/CheckoutPicker";
import { BookingHistorySection } from "@/components/bookings/BookingHistorySection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import {
  checkInDog,
  enrichDogWithCheckin,
} from "@/lib/checkins";
import { getDogPhotoSrc } from "@/lib/dogAssets";
import {
  getStaffDocumentUrl,
  getStaffDogDocuments,
} from "@/lib/documents";
import { findCurrentVaccinationDocument } from "@/lib/portal/documents";
import {
  getDogById,
  INCOMPLETE_SETUP_MESSAGE,
} from "@/lib/dogs";
import { getDogBookingHistory } from "@/lib/bookings";
import { slideUp } from "@/lib/motion";
import type { CareTask, Dog, DogDocument, KennelAssignment, Payment, TimelineEvent } from "@/lib/types";
import { cn, formatBookingDate, formatCheckInTime, formatTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  Activity,
  AlertTriangle,
  Apple,
  Check,
  Clock,
  FileText,
  LogIn,
  LogOut,
  Loader2,
  Pencil,
  Phone,
  Pill,
  Plus,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function createId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatDocumentDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function TriStateAnswer({
  value,
  invert = false,
}: {
  value: boolean | null;
  invert?: boolean;
}) {
  const isPositive = invert ? value === false : value === true;

  if (value === true || value === false) {
    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-danger">
          <span className="h-2 w-2 rounded-full bg-danger" aria-hidden />
          {value ? "Yes" : "No"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        {value ? "Yes" : "No"}
      </span>
    );
  }
  return <span className="text-muted-foreground">Not recorded</span>;
}

function TimelineIcon({ type }: { type: TimelineEvent["type"] }) {
  const className = "h-4 w-4";
  switch (type) {
    case "check-in":
      return <LogIn className={className} />;
    case "check-out":
      return <LogOut className={className} />;
    case "medication":
      return <Pill className={className} />;
    case "care":
      return <Apple className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "note":
      return <FileText className={className} />;
    default:
      return <Clock className={className} />;
  }
}

interface DogDetailViewProps {
  dogId: string;
}

export function DogDetailView({ dogId }: DogDetailViewProps) {
  const { accessLevel } = useFacilityAccess();
  const writeLocked = accessLevel !== "full";
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [checkActionLoading, setCheckActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [documents, setDocuments] = useState<DogDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const loadDog = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getDogById(dogId);
    if (result.error) {
      setDog(null);
      setError(result.error.message);
    } else {
      setDog(result.data);
    }

    setLoading(false);
  }, [dogId]);

  const loadHistoryPage = useCallback(
    (offset: number, limit: number) =>
      getDogBookingHistory(dogId, { offset, limit }),
    [dogId],
  );

  useEffect(() => {
    void loadDog();
  }, [loadDog]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setDocumentsLoading(true);
      const result = await getStaffDogDocuments(dogId);
      if (cancelled) return;

      if (result.error) {
        setDocumentError(result.error.message);
        setDocuments([]);
      } else {
        setDocuments(result.data);
        setDocumentError(null);
      }

      setDocumentsLoading(false);
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [dogId]);

  const handleOpenDocument = useCallback(async (documentId: string) => {
    const result = await getStaffDocumentUrl(documentId);
    if (result.error) {
      setDocumentError(result.error.message);
      return;
    }
    window.open(result.data, "_blank", "noopener,noreferrer");
  }, []);

  const toggleCheckStatus = useCallback(async () => {
    if (!dog || checkActionLoading) return;

    setCheckActionLoading(true);
    setActionError(null);

    if (dog.status === "checked_out") {
      let result = await checkInDog(dog.id);
      if (
        result.error?.code === "no_approved_booking" &&
        window.confirm(
          `${dog.name} doesn't have an approved booking for today. Check in anyway?`,
        )
      ) {
        result = await checkInDog(dog.id, undefined, { force: true });
      }
      if (result.error) {
        setActionError(result.error.message);
      } else {
        setDog((current) =>
          current
            ? {
                ...enrichDogWithCheckin(current, result.data),
                currentAssignment: null,
              }
            : current,
        );
        setMoveOpen(false);
        setCheckoutOpen(false);
      }
    }

    setCheckActionLoading(false);
  }, [dog, checkActionLoading]);

  const toggleCareTask = useCallback((taskId: string) => {
    setDog((current) => {
      if (!current) return current;

      return {
        ...current,
        todaysCare: current.todaysCare.map((task) => {
          if (task.id !== taskId) return task;
          const completed = !task.completed;
          return {
            ...task,
            completed,
            time: completed
              ? new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date())
              : undefined,
          } satisfies CareTask;
        }),
      };
    });
  }, []);

  const addTimelineNote = useCallback((note: string, staff = "Staff") => {
    setDog((current) => {
      if (!current) return current;

      const event: TimelineEvent = {
        id: createId(),
        time: new Date().toISOString(),
        type: "note",
        description: note,
        staff,
      };

      return { ...current, timeline: [event, ...current.timeline] };
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error && error !== "Dog not found") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-danger" role="alert">
          {error}
        </p>
        {error !== INCOMPLETE_SETUP_MESSAGE && (
          <Button variant="outline" onClick={() => void loadDog()}>
            Try again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/dogs")}>
          Back to Dogs
        </Button>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-foreground">Dog not found</p>
        <Button variant="outline" onClick={() => router.push("/dogs")}>
          Back to Dogs
        </Button>
      </div>
    );
  }

  const isCheckedIn = dog.status === "checked_in";
  const criticalMessages = getCriticalAlertMessages(dog.alerts, {
    allergyNotes: dog.allergyNotes,
    chewingRiskNotes: dog.chewingRiskNotes,
    aggressionPeopleNotes: dog.aggressionPeopleNotes,
    aggressionDogsNotes: dog.aggressionDogsNotes,
  });
  const hasNonCriticalAlerts = getActiveAlerts(dog.alerts).some(
    (alert) => !alert.critical,
  );

  function handleSaveNote() {
    if (!noteText.trim()) return;
    addTimelineNote(noteText.trim());
    setNoteText("");
    setNoteOpen(false);
  }

  return (
    <div className="-mx-4 -mt-6 md:mx-0 md:mt-0">
      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-mint to-primary sm:h-72 rounded-b-3xl md:rounded-3xl">
        <Image
          src={getDogPhotoSrc(dog.photoUrl)}
          alt={dog.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1024px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {writeLocked ? (
          <button
            type="button"
            disabled
            title={WRITE_LOCKED_TITLE}
            className="absolute right-4 top-4 flex min-h-[44px] items-center gap-2 rounded-xl bg-black/40 px-3 py-2 text-sm font-medium text-white/60 backdrop-blur-sm opacity-70"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </button>
        ) : (
          <Link
            href={`/dogs/${dogId}/edit`}
            className="absolute right-4 top-4 flex min-h-[44px] items-center gap-2 rounded-xl bg-black/40 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/55"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Link>
        )}
        {isCheckedIn && (
          <div className="absolute left-4 top-4">
            <LocationChip assignment={dog.currentAssignment} />
          </div>
        )}
        {isCheckedIn && dog.activeCheckinId && (
          <div className="absolute bottom-20 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoveOpen((open) => !open)}
              aria-expanded={moveOpen}
              className="border-white/40 bg-black/40 text-white backdrop-blur-sm hover:bg-black/55"
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
              Move Kennel
            </Button>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{dog.name}</h2>
              <p className="mt-1 text-sm text-white/90">
                {[
                  dog.breed,
                  dog.age,
                  dog.gender === "male"
                    ? "Male"
                    : dog.gender === "female"
                      ? "Female"
                      : null,
                ]
                  .filter((part): part is string => Boolean(part))
                  .join(" · ")}
                {" · "}
                <span className="capitalize">{dog.size}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DogStatusBadge status={dog.status} />
              <DogVisitBadge isReturning={dog.isReturning} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 pb-32">
        {isCheckedIn && moveOpen && dog.activeCheckinId && (
          <MoveKennelPicker
            checkinId={dog.activeCheckinId}
            onAssigned={(assignment: KennelAssignment) => {
              setDog((current) =>
                current
                  ? { ...current, currentAssignment: assignment }
                  : current,
              );
              setMoveOpen(false);
            }}
            onClose={() => setMoveOpen(false)}
          />
        )}

        <AnimatePresence>
          {actionError && (
            <motion.div
              key="action-error"
              {...slideUp}
              // #FEF2F2 = documented Alert error tint (Alert.tsx precedent, D-04)
              className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {actionError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Critical alerts — always near top; #FEF2F2 = documented Alert error tint (D-04) */}
        {criticalMessages.length > 0 && (
          <Card className="border-2 border-danger/40 bg-[#FEF2F2]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[22px] text-danger">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {criticalMessages.map((alert) => (
                <div
                  key={alert.type}
                  className="rounded-xl border border-danger/30 bg-surface p-3"
                >
                  <p className="text-sm font-semibold text-danger">
                    {alert.type}
                  </p>
                  <p className="mt-0.5 text-sm text-danger">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Non-critical alert badges */}
        {hasCriticalAlerts(dog.alerts) === false && hasNonCriticalAlerts && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Care Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <DogAlertBadges
                alerts={dog.alerts}
                vaccinationExpiryDate={dog.vaccinationExpiryDate}
              />
            </CardContent>
          </Card>
        )}

        {hasNonCriticalAlerts && criticalMessages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Additional Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <DogAlertBadges
                alerts={{
                  ...dog.alerts,
                  allergy: false,
                  chewingRisk: false,
                  aggressionTowardsPeople: false,
                  aggressionTowardsDogs: false,
                }}
                vaccinationExpiryDate={dog.vaccinationExpiryDate}
              />
            </CardContent>
          </Card>
        )}

        {/* Owner */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" aria-hidden />
              {dog.client ? "Linked Client" : "Owner Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dog.client ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{dog.client.name}</p>
                    {dog.client.phone && (
                      <a
                        href={`tel:${dog.client.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {dog.client.phone}
                      </a>
                    )}
                    {dog.client.email && (
                      <a
                        href={`mailto:${dog.client.email}`}
                        className="mt-1 block text-sm text-primary hover:underline"
                      >
                        {dog.client.email}
                      </a>
                    )}
                  </div>
                  {dog.client.phone && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`tel:${dog.client?.phone ?? ""}`)}
                      aria-label={`Call ${dog.client.name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {(dog.client.emergencyContact || dog.client.address) && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-3">
                    {dog.client.emergencyContact && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                          Emergency
                        </dt>
                        <dd className="mt-1 text-sm font-medium">
                          <span className="text-foreground">
                            {dog.client.emergencyContact}
                          </span>
                          {dog.client.emergencyPhone && (
                            <>
                              {" "}
                              <a
                                href={`tel:${dog.client.emergencyPhone}`}
                                className="text-primary hover:underline"
                              >
                                {dog.client.emergencyPhone}
                              </a>
                            </>
                          )}
                        </dd>
                      </div>
                    )}
                    {dog.client.address && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                          Address
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-foreground">
                          {dog.client.address}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                <Link
                  href={`/clients/${dog.client.id}`}
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  View client profile
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{dog.owner.name}</p>
                    <a
                      href={`tel:${dog.owner.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {dog.owner.phone}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`tel:${dog.owner.phone}`)}
                    aria-label={`Call ${dog.owner.name}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Emergency
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      <a
                        href={`tel:${dog.owner.emergencyPhone}`}
                        className="text-primary hover:underline"
                      >
                        {dog.owner.emergencyContact} — {dog.owner.emergencyPhone}
                      </a>
                    </dd>
                  </div>
                  {dog.owner.veterinarian && (
                    <div>
                      <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                        <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                        Vet
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        <p>{dog.owner.veterinarian}</p>
                        <a
                          href={`tel:${dog.owner.vetPhone}`}
                          className="text-primary hover:underline"
                        >
                          {dog.owner.vetPhone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        {/* Health & Safety */}
        <Card className="border-t-4 border-t-warning">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" aria-hidden />
              Health &amp; Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Aggressive towards people
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <TriStateAnswer value={dog.aggressionTowardsPeople} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Aggressive towards other dogs
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <TriStateAnswer value={dog.aggressionTowardsDogs} />
                </dd>
              </div>
              {dog.alerts.escapeRisk && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Escape risk
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-danger">Yes</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Separation anxiety
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <TriStateAnswer value={dog.separationAnxiety} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Chewing / self-harm risk
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <TriStateAnswer value={dog.chewingRisk} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Kennel trained
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <TriStateAnswer value={dog.kennelTrained} invert />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Vaccination expiry date
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {dog.vaccinationExpiryDate ? (
                    formatBookingDate(dog.vaccinationExpiryDate)
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4 space-y-4">
              {dog.alerts.medication && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Medication
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {dog.care.medication !== "None"
                      ? dog.care.medication
                      : "Required — see staff notes"}
                  </p>
                </div>
              )}
              {dog.alerts.allergy && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Allergy
                  </p>
                  <p className="mt-1 text-sm font-medium">{dog.care.allergies}</p>
                </div>
              )}
              {dog.aggressionTowardsPeople === true &&
                dog.aggressionPeopleNotes && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notes — Aggressive towards people
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {dog.aggressionPeopleNotes}
                    </p>
                  </div>
                )}
              {dog.aggressionTowardsDogs === true && dog.aggressionDogsNotes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes — Aggressive towards other dogs
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {dog.aggressionDogsNotes}
                  </p>
                </div>
              )}
              {dog.separationAnxiety === true && dog.separationAnxietyNotes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes — Separation anxiety
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {dog.separationAnxietyNotes}
                  </p>
                </div>
              )}
              {dog.chewingRisk === true && dog.chewingRiskNotes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes — Chewing / self-harm risk
                  </p>
                  <p className="mt-1 text-sm font-medium">{dog.chewingRiskNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feeding */}
        <Card className="border-t-4 border-t-marker">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" aria-hidden />
              Feeding
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Food source
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  Set per booking
                </dd>
              </div>
              {dog.feedingMealsPerDay !== null && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Meals
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {dog.feedingMealsPerDay} meal
                    {dog.feedingMealsPerDay === 1 ? "" : "s"} per day
                  </dd>
                </div>
              )}
            </dl>
            {dog.care.feedingNotes !== "None" && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-sm font-medium">{dog.care.feedingNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other behavioural notes */}
        {dog.care.behavior !== "No notes" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" aria-hidden />
                Other Behavioural Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              <p className="text-muted-foreground">{dog.care.behavior}</p>
            </CardContent>
          </Card>
        )}

        {/* Documents (read-only) */}
        <Card className="border-t-4 border-t-info">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {documentError && (
              <p className="text-sm text-danger" role="alert">
                {documentError}
              </p>
            )}

            {documentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents yet</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => {
                  const isCurrent =
                    findCurrentVaccinationDocument(documents)?.id === doc.id;
                  return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => void handleOpenDocument(doc.id)}
                      className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        Vaccination stamp
                      </span>
                      {isCurrent ? (
                        <Badge variant="teal">Current</Badge>
                      ) : null}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDocumentDate(doc.createdAt)}
                      </span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Today's care */}
        {isCheckedIn && dog.todaysCare.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" aria-hidden />
                Today&apos;s Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {dog.todaysCare.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleCareTask(task.id)}
                  className={cn(
                    "flex w-full min-h-[44px] items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    task.completed
                      ? // #ECFDF5 = documented Alert success tint (Alert.tsx precedent, D-04)
                        "border-success/40 bg-[#ECFDF5]"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      task.completed
                        ? "border-success bg-success text-white"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {task.completed && (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.completed ? "text-success" : "text-foreground",
                      )}
                    >
                      {task.task}
                    </p>
                    {task.time && (
                      <p className="text-xs text-muted-foreground">{task.time}</p>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="border-t-4 border-t-mint">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" aria-hidden />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dog.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet today.</p>
            ) : (
              <div className="space-y-4">
                {dog.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {/* mint-wash #EAF4F1 = documented D-04 timeline-node tint (Wave-2 precedent) */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-wash text-primary">
                        <TimelineIcon type={event.type} />
                      </div>
                      {index < dog.timeline.length - 1 && (
                        <div className="mt-2 w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.time)}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {event.description}
                      </p>
                      {event.staff && (
                        <p className="text-xs text-muted-foreground">
                          by {event.staff}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <BookingHistorySection
          loadPage={loadHistoryPage}
          hrefForEntry={(entry) => `/bookings/${entry.booking.id}`}
        />

        <p className="text-center text-xs text-muted-foreground">
          Last check-in: {formatCheckInTime(dog.lastCheckIn)}
        </p>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm md:bottom-0">
        <div className="mx-auto max-w-5xl space-y-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+4rem)] md:pb-4">
          {checkoutOpen && isCheckedIn && dog.activeCheckinId ? (
            <CheckoutPicker
              checkinId={dog.activeCheckinId}
              onComplete={(payment: Payment) => {
                setDog((current) =>
                  current
                    ? {
                        ...current,
                        status: "checked_out",
                        activeCheckinId: null,
                        currentAssignment: null,
                        lastCheckOut: payment.paidAt,
                      }
                    : current,
                );
                setCheckoutOpen(false);
                setMoveOpen(false);
              }}
              onClose={() => setCheckoutOpen(false)}
            />
          ) : noteOpen ? (
            <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Add Note</p>
                <button
                  type="button"
                  onClick={() => setNoteOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Close note form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={`Note about ${dog.name}...`}
                rows={3}
              />
              <Button className="w-full" onClick={handleSaveNote}>
                Save Note
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setNoteOpen(true)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Note
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`tel:${dog.owner.phone}`)}
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call Owner
              </Button>
              <Button
                variant={isCheckedIn ? "danger" : "primary"}
                className="col-span-2"
                size="lg"
                disabled={checkActionLoading}
                onClick={() => {
                  if (isCheckedIn) {
                    setCheckoutOpen(true);
                    setNoteOpen(false);
                    setMoveOpen(false);
                  } else {
                    void toggleCheckStatus();
                  }
                }}
              >
                {checkActionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Checking in...
                  </>
                ) : isCheckedIn ? (
                  <>
                    <LogOut className="h-4 w-4" aria-hidden />
                    Check Out {dog.name}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Check In {dog.name}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
