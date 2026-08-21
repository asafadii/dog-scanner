"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  BookingFormConfig,
  BookingFormFieldState,
  BookingServiceType,
  DogSize,
  FeedingSource,
} from "@/lib/types";
import {
  BOOKING_FORM_FIELD_GROUPS,
  LOCKED_BOOKING_FORM_FIELDS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

const SIZES: DogSize[] = ["small", "medium", "large"];
const SERVICE_TYPES: BookingServiceType[] = ["daycare", "boarding"];

const LOCKED_LABELS: Record<
  (typeof LOCKED_BOOKING_FORM_FIELDS)[number],
  string
> = {
  name: "Dog name",
  ownerName: "Owner name",
  ownerEmail: "Owner email",
  aggressionTowardsPeople: "Aggression towards people",
  aggressionTowardsDogs: "Aggression towards dogs",
};

type TriState = boolean | null;

interface FormState {
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  microchipNumber: string;
  isNeutered: TriState;
  healthCertificateNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  ownerEmergencyContact: string;
  ownerEmergencyPhone: string;
  ownerNotes: string;
  aggressionTowardsPeople: TriState;
  aggressionTowardsDogs: TriState;
  separationAnxiety: TriState;
  chewingRisk: TriState;
  kennelTrained: TriState;
  feedingSource: FeedingSource | null;
  feedingMealsPerDay: 1 | 2 | 3;
  feedingNotes: string;
  behavior: string;
  serviceType: BookingServiceType;
  startDate: string;
  endDate: string;
  transportRequired: boolean;
}

const initialForm: FormState = {
  name: "",
  breed: "",
  age: "",
  size: "medium",
  microchipNumber: "",
  isNeutered: null,
  healthCertificateNumber: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  ownerAddress: "",
  ownerEmergencyContact: "",
  ownerEmergencyPhone: "",
  ownerNotes: "",
  aggressionTowardsPeople: null,
  aggressionTowardsDogs: null,
  separationAnxiety: null,
  chewingRisk: null,
  kennelTrained: null,
  feedingSource: "facility",
  feedingMealsPerDay: 2,
  feedingNotes: "",
  behavior: "",
  serviceType: "daycare",
  startDate: "",
  endDate: "",
  transportRequired: false,
};

function getFieldState(
  config: BookingFormConfig,
  key: string,
): BookingFormFieldState {
  if ((LOCKED_BOOKING_FORM_FIELDS as readonly string[]).includes(key)) {
    return "required";
  }
  return config[key] ?? "optional";
}

function isFieldVisible(config: BookingFormConfig, key: string): boolean {
  if ((LOCKED_BOOKING_FORM_FIELDS as readonly string[]).includes(key)) {
    return true;
  }
  return getFieldState(config, key) !== "hidden";
}

function labelWithRequired(label: string, required: boolean): string {
  return required ? `${label} *` : label;
}

function TriStateControl({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const options: { key: string; label: string; next: TriState }[] = [
    { key: "yes", label: "Yes", next: true },
    { key: "no", label: "No", next: false },
    { key: "unknown", label: "Unknown", next: null },
  ];

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">
        {labelWithRequired(label, Boolean(required))}
      </span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.next)}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              value === option.next
                ? "border-primary bg-mint-wash text-primary"
                : "border-border bg-surface text-muted-foreground hover:bg-muted",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">
        {labelWithRequired(label, Boolean(required))}
      </span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors",
              value === option.value
                ? "border-primary bg-mint-wash text-primary"
                : "border-border bg-surface text-muted-foreground hover:bg-muted",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EmbedBookingPage() {
  const params = useParams<{ facilityCode: string }>();
  const facilityCode = params.facilityCode;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [config, setConfig] = useState<BookingFormConfig>({});
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!facilityCode) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/embed/${encodeURIComponent(facilityCode)}/config`,
      );

      if (response.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Could not load booking form");
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as {
        data: {
          facilityName: string;
          bookingFormConfig: BookingFormConfig;
          facilityId: string;
        };
      };

      setFacilityName(payload.data.facilityName);
      setConfig(payload.data.bookingFormConfig ?? {});
      setNotFound(false);
    } catch {
      setError("Could not load booking form");
    }

    setLoading(false);
  }, [facilityCode]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  const visibleGroups = useMemo(() => {
    return BOOKING_FORM_FIELD_GROUPS.map((group) => ({
      ...group,
      fields: group.fields.filter((field) => isFieldVisible(config, field.key)),
    })).filter((group) => group.fields.length > 0);
  }, [config]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/embed/${encodeURIComponent(facilityCode)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setError(
          payload?.error ??
            (response.status === 429
              ? "Too many attempts. Please try again later."
              : "Could not submit booking"),
        );
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not submit booking");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          Loading booking form...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] p-6">
        <p className="text-center text-sm text-muted-foreground">
          This booking form is not available.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="font-display text-2xl font-extrabold text-primary">
            Booking submitted!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your email for next steps.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://hellodora.app"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline underline-offset-2"
            >
              hello DORA
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-primary">
            Book with
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {facilityName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill in your details below to request a booking.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {error && (
            <div
              className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Required details
            </h2>
            <Input
              label={labelWithRequired(LOCKED_LABELS.name, true)}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label={labelWithRequired(LOCKED_LABELS.ownerName, true)}
              value={form.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label={labelWithRequired(LOCKED_LABELS.ownerEmail, true)}
              type="email"
              value={form.ownerEmail}
              onChange={(e) => updateField("ownerEmail", e.target.value)}
              required
              disabled={submitting}
            />
            <TriStateControl
              label={LOCKED_LABELS.aggressionTowardsPeople}
              value={form.aggressionTowardsPeople}
              onChange={(value) =>
                updateField("aggressionTowardsPeople", value)
              }
              required
              disabled={submitting}
            />
            <TriStateControl
              label={LOCKED_LABELS.aggressionTowardsDogs}
              value={form.aggressionTowardsDogs}
              onChange={(value) => updateField("aggressionTowardsDogs", value)}
              required
              disabled={submitting}
            />
          </section>

          {visibleGroups.map((group) => (
            <section
              key={group.section}
              className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {group.section}
              </h2>
              {group.fields.map((field) => {
                const required = getFieldState(config, field.key) === "required";
                const key = field.key as keyof FormState;

                if (key === "size") {
                  return (
                    <SegmentedControl
                      key={field.key}
                      label={field.label}
                      value={form.size}
                      required={required}
                      disabled={submitting}
                      options={SIZES.map((size) => ({
                        value: size,
                        label: size,
                      }))}
                      onChange={(value) => updateField("size", value)}
                    />
                  );
                }

                if (
                  key === "isNeutered" ||
                  key === "separationAnxiety" ||
                  key === "chewingRisk" ||
                  key === "kennelTrained"
                ) {
                  return (
                    <TriStateControl
                      key={field.key}
                      label={field.label}
                      value={form[key] as TriState}
                      required={required}
                      disabled={submitting}
                      onChange={(value) => updateField(key, value)}
                    />
                  );
                }

                if (key === "feedingSource") {
                  return (
                    <SegmentedControl
                      key={field.key}
                      label={field.label}
                      value={form.feedingSource}
                      required={required}
                      disabled={submitting}
                      options={[
                        { value: "own", label: "Own food" },
                        { value: "facility", label: "Facility food" },
                      ]}
                      onChange={(value) => updateField("feedingSource", value)}
                    />
                  );
                }

                if (key === "feedingMealsPerDay") {
                  return (
                    <SegmentedControl
                      key={field.key}
                      label={field.label}
                      value={String(form.feedingMealsPerDay) as "1" | "2" | "3"}
                      required={required}
                      disabled={submitting}
                      options={[
                        { value: "1", label: "1" },
                        { value: "2", label: "2" },
                        { value: "3", label: "3" },
                      ]}
                      onChange={(value) =>
                        updateField(
                          "feedingMealsPerDay",
                          Number(value) as 1 | 2 | 3,
                        )
                      }
                    />
                  );
                }

                if (key === "ownerNotes" || key === "feedingNotes" || key === "behavior") {
                  return (
                    <Textarea
                      key={field.key}
                      label={labelWithRequired(field.label, required)}
                      value={String(form[key] ?? "")}
                      onChange={(e) => updateField(key, e.target.value)}
                      required={required}
                      disabled={submitting}
                      rows={3}
                    />
                  );
                }

                return (
                  <Input
                    key={field.key}
                    label={labelWithRequired(field.label, required)}
                    value={String(form[key] ?? "")}
                    onChange={(e) => updateField(key, e.target.value)}
                    required={required}
                    disabled={submitting}
                  />
                );
              })}
            </section>
          ))}

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Booking</h2>
            <SegmentedControl
              label="Service type"
              value={form.serviceType}
              required
              disabled={submitting}
              options={SERVICE_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
              onChange={(value) => updateField("serviceType", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={labelWithRequired("Start date", true)}
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                label={labelWithRequired("End date", true)}
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.transportRequired}
                onChange={(e) =>
                  updateField("transportRequired", e.target.checked)
                }
                disabled={submitting}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Transport required
            </label>
          </section>

          <p className="text-sm leading-relaxed text-muted-foreground">
            This facility only allows bookings through hello DORA&apos;s system.
            You can fill out this form, or create an owner account at{" "}
            <a
              href="https://hellodora.app"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline underline-offset-2"
            >
              hellodora.app
            </a>{" "}
            to make future bookings easier.
          </p>

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {submitting ? "Submitting..." : "Submit booking"}
          </Button>
        </form>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://hellodora.app"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            hello DORA
          </a>
        </p>
      </div>
    </div>
  );
}
