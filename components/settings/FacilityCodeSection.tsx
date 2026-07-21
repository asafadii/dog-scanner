"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  generateFacilityCode,
  getFacilitySettings,
} from "@/lib/facility";
import { Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function FacilityCodeSection() {
  const [facilityCode, setFacilityCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getFacilitySettings();
    if (result.error) {
      setError(result.error.message);
      setFacilityCode(null);
    } else {
      setFacilityCode(result.data.facilityCode);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleGenerate() {
    setSaving(true);
    setError(null);
    const result = await generateFacilityCode();
    if (result.error) {
      setError(result.error.message);
    } else {
      setFacilityCode(result.data.facilityCode);
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    const confirmed = window.confirm(
      "This will invalidate the current code — anyone who has it will no longer be able to link to your facility. Continue?",
    );
    if (!confirmed) return;
    await handleGenerate();
  }

  async function handleCopy() {
    if (!facilityCode) return;
    try {
      await navigator.clipboard.writeText(facilityCode);
      setCopied(true);
    } catch {
      setError("Could not copy code. Please copy it manually.");
    }
  }

  return (
    <Card id="facility-code">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-5 w-5 text-muted-foreground" aria-hidden />
          Facility Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Share this code with dog owners so they can link their hello DORA
          account to your facility. They&apos;ll enter it from their portal home
          page.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading facility code...
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            {facilityCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
                  <p className="flex-1 font-mono text-lg font-semibold tracking-widest text-foreground">
                    {facilityCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => void handleRegenerate()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Regenerate
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleGenerate()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                Generate a facility code
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
