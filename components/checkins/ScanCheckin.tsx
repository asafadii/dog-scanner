"use client";

import { checkInDog } from "@/lib/checkins";
import { resolveCheckinToken } from "@/lib/checkin/resolveToken";
import { normalizeCheckinTokenInput } from "@/lib/portal/checkinToken";
import { getDogById } from "@/lib/dogs";
import { appearScale, slideUp } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ScanLine } from "lucide-react";
import QrScanner from "qr-scanner";
import { useCallback, useEffect, useRef, useState } from "react";

type ScanPhase = "idle" | "processing" | "success";

export function ScanCheckin({
  initialToken = null,
}: {
  initialToken?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);
  const initialTokenHandledRef = useRef(false);

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
    if (!initialToken || initialTokenHandledRef.current) return;
    initialTokenHandledRef.current = true;
    void handleToken(initialToken);
  }, [initialToken, handleToken]);

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

  return (
    <AnimatePresence mode="wait">
      {phase === "success" ? (
        <motion.div key="success" {...appearScale}>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-display text-2xl text-success">Checked in!</p>
              <p className="mt-2 text-muted-foreground">
                {successDogName ?? "Dog"} is now on site.
              </p>
              <Button className="mt-6" onClick={resetForNextScan}>
                Scan next dog
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div key="scan" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="h-5 w-5 text-primary" aria-hidden />
                Scan QR code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* QR-frame overlay (design 591-599): dark viewport + mint corner brackets + scan line
                  wraps the existing qr-scanner <video>; decode/camera behavior untouched.
                  #0c1a17 = design dark viewport literal, documented D-04 exception (no named token). */}
              <div className="relative h-[250px] overflow-hidden rounded-2xl bg-[#0c1a17]">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-5 top-5 h-[34px] w-[34px] rounded-tl-lg border-l-[4px] border-t-[4px] border-mint" />
                  <div className="absolute right-5 top-5 h-[34px] w-[34px] rounded-tr-lg border-r-[4px] border-t-[4px] border-mint" />
                  <div className="absolute bottom-5 left-5 h-[34px] w-[34px] rounded-bl-lg border-b-[4px] border-l-[4px] border-mint" />
                  <div className="absolute bottom-5 right-5 h-[34px] w-[34px] rounded-br-lg border-b-[4px] border-r-[4px] border-mint" />
                  {/* scan line: mint gradient (#A4D2C8 = --dora-mint) + glow */}
                  <div className="absolute inset-x-5 top-1/2 h-[3px] bg-[linear-gradient(90deg,transparent,#A4D2C8,transparent)] shadow-[0_0_12px_#A4D2C8]" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Point at the owner&apos;s check-in QR code.
              </p>
              {cameraError && (
                <p className="text-sm text-warning" role="status">
                  {cameraError}
                </p>
              )}
              {phase === "processing" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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

          <AnimatePresence>
            {error && (
              <motion.div
                key="scan-error"
                {...slideUp}
                className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
