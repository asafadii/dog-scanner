"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { runAuthSetup } from "@/lib/authSetup";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

type PendingInvite = {
  facilityName: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function fetchPendingInvite(rawEmail: string): Promise<PendingInvite | null> {
  const trimmed = normalizeEmail(rawEmail);
  if (!trimmed.includes("@")) return null;

  try {
    const response = await fetch(
      `/api/staff/invite/check-pending?email=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return null;

    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return null;

    const record = body as {
      pending?: unknown;
      facilityName?: unknown;
    };
    if (record.pending !== true) {
      return null;
    }

    const facilityName =
      typeof record.facilityName === "string" && record.facilityName.trim()
        ? record.facilityName.trim()
        : "a facility";

    return { facilityName };
  } catch {
    return null;
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const dismissedForEmailRef = useRef<string | null>(null);

  async function handleEmailBlur() {
    const trimmedEmail = normalizeEmail(email);
    if (!trimmedEmail.includes("@")) {
      setPendingInvite(null);
      return;
    }
    if (dismissedForEmailRef.current === trimmedEmail) return;

    const pending = await fetchPendingInvite(trimmedEmail);
    if (normalizeEmail(email) !== trimmedEmail) return;
    setPendingInvite(pending);
  }

  function handleDismissInvite() {
    dismissedForEmailRef.current = normalizeEmail(email);
    setPendingInvite(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = normalizeEmail(email);
    const trimmedFullName = fullName.trim();
    const trimmedFacilityName = facilityName.trim();

    if (dismissedForEmailRef.current !== trimmedEmail && pendingInvite) {
      return;
    }

    setLoading(true);

    try {
      if (dismissedForEmailRef.current !== trimmedEmail) {
        const pending = await fetchPendingInvite(trimmedEmail);
        if (pending) {
          setPendingInvite(pending);
          return;
        }
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            facility_name: trimmedFacilityName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError("Account could not be created. Please try again.");
        return;
      }

      if (!data.session?.access_token) {
        setInfo(
          "Check your email to confirm your account. After you confirm and sign in, we'll finish setting up your facility automatically.",
        );
        return;
      }

      await runAuthSetup(data.session.access_token, {
        fullName: trimmedFullName,
        facilityName: trimmedFacilityName,
        email: trimmedEmail,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="DORA home"
          >
            <Logo size={32} />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Create account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your daycare or boarding facility
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Full Name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
              />
              <Input
                label="Facility Name"
                type="text"
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Happy Paws Daycare"
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (pendingInvite) setPendingInvite(null);
                }}
                onBlur={() => {
                  void handleEmailBlur();
                }}
                placeholder="you@facility.com"
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />

              {pendingInvite && (
                <div
                  className="rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning"
                  role="status"
                >
                  <p>
                    You have a pending invite to join {pendingInvite.facilityName}. Check your email for the invite link to accept it.
                  </p>
                  <button
                    type="button"
                    onClick={handleDismissInvite}
                    className="mt-2 text-xs font-medium text-warning/80 underline underline-offset-2 hover:text-warning"
                  >
                    Continue creating a new facility
                  </button>
                </div>
              )}

              {error && (
                <p
                  /* Alert error tint #FEF2F2 — documented D-04 exception (Alert.tsx precedent) */
                  className="rounded-xl border border-danger/20 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {info && (
                <p
                  /* mint-wash #EAF4F1 — documented D-04 exception (Wave-2 precedent) */
                  className="rounded-xl border border-primary/20 bg-[#EAF4F1] px-4 py-3 text-sm text-primary"
                  role="status"
                >
                  {info}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
