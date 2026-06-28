"use client";

import { checkInDog } from "@/lib/checkins";
import { resolveCheckinToken } from "@/lib/checkin/resolveToken";
import { normalizeCheckinTokenInput } from "@/lib/portal/checkinToken";
import { getDogById } from "@/lib/dogs";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader2, ScanLine } from "lucide-react";
import QrScanner from "qr-scanner";
import { useCallback, useEffect, useRef, useState } from "react";

type ScanPhase = "idle" | "processing" | "success";

export function ScanCheckin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [successDogName, setSuccessDogName] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const resetForNextScan = useCallback(() => {
    setPhase("idle");
    setError(null);
    setSuccessDogName(null);
    setManualCode("");
    processingRef.current = false;
  }, []);

  const handleToken = useCallback(
    async (rawToken: string) => {
      if (processingRef.current || phase === "success") return;

      const token = normalizeCheckinTokenInput(rawToken);
      if (!token) return;

      processingRef.current = true;
      setPhase("processing");
      setError(null);

      try {
        const resolved = await resolveCheckinToken(token);
        const checkInResult = await checkInDog(
          resolved.dogId,
          resolved.bookingId,
        );

        if (checkInResult.error) {
          setError(checkInResult.error.message);
          setPhase("idle");
          processingRef.current = false;
          return;
        }

        const dogResult = await getDogById(resolved.dogId);
        setSuccessDogName(
          dogResult.error ? "Your dog" : dogResult.data.name,
        );
        setPhase("success");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process check-in code.",
        );
        setPhase("idle");
        processingRef.current = false;
      }
    },
    [phase],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase === "success") return;

    let cancelled = false;
    const scanner = new QrScanner(
      video,
      (result) => {
        if (!cancelled) {
          void handleToken(result.data);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
      },
    );

    scannerRef.current = scanner;

    void scanner.start().catch(() => {
      if (!cancelled) {
        setCameraError(
          "Camera unavailable. Use manual code entry below.",
        );
      }
    });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [handleToken, phase]);

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    await handleToken(manualCode);
  }

  if (phase === "success") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-2xl font-bold text-emerald-700">Checked in!</p>
          <p className="mt-2 text-stone-600">
            {successDogName ?? "Dog"} is now on site.
          </p>
          <Button className="mt-6" onClick={resetForNextScan}>
            Scan next dog
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-5 w-5 text-[oklch(0.531_0.092_185.0)]" aria-hidden />
            Scan QR code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900">
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              muted
              playsInline
            />
          </div>
          {cameraError && (
            <p className="text-sm text-amber-800" role="status">
              {cameraError}
            </p>
          )}
          {phase === "processing" && (
            <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Processing check-in...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Enter code manually</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              label="Check-in code"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Paste or type the code from the owner"
              autoComplete="off"
              disabled={phase === "processing"}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={phase === "processing" || !manualCode.trim()}
            >
              {phase === "processing" ? "Processing..." : "Submit code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
