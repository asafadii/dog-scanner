"use client";

import {
  DogAlertBadges,
  getCriticalAlertMessages,
  hasCriticalAlerts,
} from "@/components/dogs/DogAlertBadges";
import { DogStatusBadge } from "@/components/dogs/DogStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useMockStore } from "@/lib/mockStore";
import type { TimelineEvent } from "@/lib/types";
import { cn, formatCheckInTime, formatTime } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Apple,
  Check,
  Clock,
  FileText,
  LogIn,
  LogOut,
  Phone,
  Pill,
  Plus,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
  const { getDog, toggleCheckStatus, toggleCareTask, addTimelineNote } =
    useMockStore();
  const dog = getDog(dogId);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!dog) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-stone-700">Dog not found</p>
        <Button variant="outline" onClick={() => router.push("/dogs")}>
          Back to Dogs
        </Button>
      </div>
    );
  }

  const isCheckedIn = dog.status === "checked_in";
  const criticalMessages = getCriticalAlertMessages(dog.alerts, dog.care);
  const criticalOnly = criticalMessages.filter((m) => m.critical);

  function handleSaveNote() {
    if (!noteText.trim()) return;
    addTimelineNote(dogId, noteText.trim());
    setNoteText("");
    setNoteOpen(false);
  }

  return (
    <div className="-mx-4 -mt-6 md:mx-0 md:mt-0">
      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-teal-400 to-teal-600 sm:h-64">
        {dog.photoUrl ? (
          <Image
            src={dog.photoUrl}
            alt={dog.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-100 to-amber-50 text-6xl font-bold text-teal-700">
            {dog.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{dog.name}</h2>
              <p className="mt-1 text-sm text-white/90">
                {dog.breed} · {dog.age} ·{" "}
                <span className="capitalize">{dog.size}</span>
              </p>
            </div>
            <DogStatusBadge status={dog.status} />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 pb-32">
        {/* Critical alerts — always near top */}
        {criticalOnly.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {criticalOnly.map((alert) => (
                <div
                  key={alert.type}
                  className="rounded-xl border border-red-200 bg-white p-3"
                >
                  <p className="text-sm font-semibold text-red-900">
                    {alert.type}
                  </p>
                  <p className="mt-0.5 text-sm text-red-800">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Non-critical alert badges */}
        {hasCriticalAlerts(dog.alerts) === false &&
          getCriticalAlertMessages(dog.alerts, dog.care).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Care Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <DogAlertBadges alerts={dog.alerts} />
                {getCriticalAlertMessages(dog.alerts, dog.care)
                  .filter((m) => !m.critical)
                  .map((alert) => (
                    <div key={alert.type} className="text-sm">
                      <span className="font-medium text-stone-800">
                        {alert.type}:
                      </span>{" "}
                      <span className="text-stone-600">{alert.message}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

        {getCriticalAlertMessages(dog.alerts, dog.care).some(
          (m) => !m.critical,
        ) &&
          criticalOnly.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Additional Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {getCriticalAlertMessages(dog.alerts, dog.care)
                  .filter((m) => !m.critical)
                  .map((alert) => (
                    <div
                      key={alert.type}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm"
                    >
                      <span className="font-medium">{alert.type}:</span>{" "}
                      {alert.message}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

        {/* Owner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" aria-hidden />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-900">{dog.owner.name}</p>
                <a
                  href={`tel:${dog.owner.phone}`}
                  className="text-sm text-teal-600 hover:underline"
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
            <div className="grid gap-2 border-t border-stone-100 pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Emergency</span>
                <a
                  href={`tel:${dog.owner.emergencyPhone}`}
                  className="text-right font-medium text-teal-600 hover:underline"
                >
                  {dog.owner.emergencyContact} — {dog.owner.emergencyPhone}
                </a>
              </div>
              {dog.owner.veterinarian && (
                <div className="flex items-start justify-between gap-4">
                  <span className="flex items-center gap-1 text-stone-500">
                    <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                    Vet
                  </span>
                  <div className="text-right">
                    <p className="font-medium">{dog.owner.veterinarian}</p>
                    <a
                      href={`tel:${dog.owner.vetPhone}`}
                      className="text-teal-600 hover:underline"
                    >
                      {dog.owner.vetPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Care instructions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" aria-hidden />
              Care Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 text-sm">
            {[
              { icon: Pill, label: "Medication", text: dog.care.medication },
              { icon: Apple, label: "Feeding", text: dog.care.feeding },
              {
                icon: AlertTriangle,
                label: "Allergies",
                text: dog.care.allergies,
              },
              { icon: Activity, label: "Behavior", text: dog.care.behavior },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label}>
                <div className="mb-1 flex items-center gap-2 font-semibold text-stone-800">
                  <Icon className="h-4 w-4 text-teal-600" aria-hidden />
                  {label}
                </div>
                <p className="pl-6 text-stone-600">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's care */}
        {isCheckedIn && dog.todaysCare.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-teal-600" aria-hidden />
                Today&apos;s Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {dog.todaysCare.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleCareTask(dogId, task.id)}
                  className={cn(
                    "flex w-full min-h-[44px] items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    task.completed
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-stone-200 bg-white hover:border-teal-200",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      task.completed
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-stone-300",
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
                        task.completed ? "text-emerald-900" : "text-stone-800",
                      )}
                    >
                      {task.task}
                    </p>
                    {task.time && (
                      <p className="text-xs text-stone-500">{task.time}</p>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" aria-hidden />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dog.timeline.length === 0 ? (
              <p className="text-sm text-stone-500">No activity yet today.</p>
            ) : (
              <div className="space-y-4">
                {dog.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        <TimelineIcon type={event.type} />
                      </div>
                      {index < dog.timeline.length - 1 && (
                        <div className="mt-2 w-0.5 flex-1 bg-stone-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs text-stone-500">
                        {formatTime(event.time)}
                      </p>
                      <p className="text-sm font-medium text-stone-800">
                        {event.description}
                      </p>
                      {event.staff && (
                        <p className="text-xs text-stone-500">
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

        <p className="text-center text-xs text-stone-400">
          Last check-in: {formatCheckInTime(dog.lastCheckIn)}
        </p>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-sm md:bottom-0">
        <div className="mx-auto max-w-5xl space-y-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+4rem)] md:pb-4">
          {noteOpen ? (
            <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-900">Add Note</p>
                <button
                  type="button"
                  onClick={() => setNoteOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
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
                onClick={() => toggleCheckStatus(dogId)}
              >
                {isCheckedIn ? (
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
