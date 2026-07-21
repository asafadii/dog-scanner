"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  getBookingFormConfig,
  saveBookingFormConfig,
} from "@/lib/bookingForm";
import { getFacilitySettings } from "@/lib/facility";
import type { BookingFormConfig, BookingFormFieldState } from "@/lib/types";
import {
  BOOKING_FORM_FIELD_GROUPS,
  LOCKED_BOOKING_FORM_FIELDS,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ClipboardList,
  Code2,
  Copy,
  Loader2,
  Lock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const FIELD_STATES: BookingFormFieldState[] = [
  "hidden",
  "optional",
  "required",
];

const LOCKED_FIELD_LABELS: Record<
  (typeof LOCKED_BOOKING_FORM_FIELDS)[number],
  string
> = {
  name: "Dog name",
  ownerName: "Owner name",
  ownerEmail: "Owner email",
  aggressionTowardsPeople: "Aggression towards people",
  aggressionTowardsDogs: "Aggression towards dogs",
};

function fieldState(
  config: BookingFormConfig,
  key: string,
): BookingFormFieldState {
  return config[key] ?? "optional";
}

function buildEmbedSnippet(facilityCode: string, facilityName: string): string {
  const title = facilityName || "hello DORA";
  return `<iframe
  src="https://hellodora.app/embed/book/${facilityCode}"
  width="100%"
  height="800"
  style="border:none;border-radius:12px;"
  title="Book with ${title}"
></iframe>`;
}

export function BookingFormSection() {
  const [config, setConfig] = useState<BookingFormConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facilityCode, setFacilityCode] = useState<string | null>(null);
  const [facilityName, setFacilityName] = useState<string>("");
  const [embedLoading, setEmbedLoading] = useState(true);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getBookingFormConfig();
    if (result.error) {
      setError(result.error.message);
      setConfig({});
    } else {
      setConfig(result.data);
    }

    setLoading(false);
  }, []);

  const loadFacility = useCallback(async () => {
    setEmbedLoading(true);
    setEmbedError(null);

    const result = await getFacilitySettings();
    if (result.error) {
      setEmbedError(result.error.message);
      setFacilityCode(null);
      setFacilityName("");
    } else {
      setFacilityCode(result.data.facilityCode);
      setFacilityName(result.data.name ?? "");
    }

    setEmbedLoading(false);
  }, []);

  useEffect(() => {
    void loadConfig();
    void loadFacility();
  }, [loadConfig, loadFacility]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const embedSnippet = useMemo(() => {
    if (!facilityCode) return "";
    return buildEmbedSnippet(facilityCode, facilityName);
  }, [facilityCode, facilityName]);

  function updateFieldState(key: string, state: BookingFormFieldState) {
    setConfig((prev) => ({ ...prev, [key]: state }));
    setSuccess(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: BookingFormConfig = {};
    for (const group of BOOKING_FORM_FIELD_GROUPS) {
      for (const field of group.fields) {
        payload[field.key] = fieldState(config, field.key);
      }
    }

    const result = await saveBookingFormConfig(payload);
    if (result.error) {
      setError(result.error.message);
    } else {
      setConfig(payload);
      setSuccess("Booking form settings saved.");
    }

    setSaving(false);
  }

  async function handleCopySnippet() {
    if (!embedSnippet) return;
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
    } catch {
      setEmbedError("Could not copy snippet. Please copy it manually.");
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
            Booking Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <p className="text-sm text-muted-foreground">
            Choose what information owners fill out when booking through your
            website. This doesn&apos;t affect your staff dog form — only the
            public booking widget.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading booking form settings...
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="rounded-xl border border-success/25 bg-[#ECFDF5] px-4 py-3 text-sm text-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Always required
                </p>
                <ul className="space-y-2">
                  {LOCKED_BOOKING_FORM_FIELDS.map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      {LOCKED_FIELD_LABELS[key]}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                {BOOKING_FORM_FIELD_GROUPS.map((group) => (
                  <div key={group.section} className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {group.section}
                    </h3>
                    <div className="space-y-3">
                      {group.fields.map((field) => {
                        const current = fieldState(config, field.key);
                        return (
                          <div
                            key={field.key}
                            className="space-y-2 rounded-xl border border-border bg-surface p-3"
                          >
                            <span className="block text-sm font-medium text-foreground">
                              {field.label}
                            </span>
                            <div className="flex gap-2">
                              {FIELD_STATES.map((state) => (
                                <button
                                  key={state}
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    updateFieldState(field.key, state)
                                  }
                                  className={cn(
                                    "min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors",
                                    current === state
                                      ? "border-primary bg-mint-wash text-primary"
                                      : "border-border bg-surface text-muted-foreground hover:bg-muted",
                                    saving && "cursor-not-allowed opacity-60",
                                  )}
                                >
                                  {state}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Save Booking Form
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="h-5 w-5 text-muted-foreground" aria-hidden />
            Embed Snippet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {embedLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading embed snippet...
            </div>
          ) : (
            <>
              {embedError && (
                <p className="text-sm text-danger" role="alert">
                  {embedError}
                </p>
              )}

              {facilityCode ? (
                <div className="space-y-3">
                  <pre className="overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {embedSnippet}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopySnippet()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy snippet"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Paste this into your website&apos;s Contact Us or Booking
                    page. Visitors will be able to book without leaving your
                    site.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate a facility code first in the{" "}
                  <a
                    href="#facility-code"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Facility Code
                  </a>{" "}
                  section above.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
