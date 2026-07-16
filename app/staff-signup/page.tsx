"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

function StaffSignupFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-12">
      <p className="text-sm text-muted-foreground">Loading invite...</p>
    </div>
  );
}

function StaffSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [email, setEmail] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!token) {
        setError("This invite link is invalid or has expired.");
        setVerifying(false);
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/staff/invite/verify?token=${encodeURIComponent(token)}`,
        );
        const body = (await response.json()) as {
          data?: { email: string; facilityName: string } | null;
          error?: string | null;
        };

        if (cancelled) return;

        if (!response.ok || !body.data) {
          setError(
            body.error ?? "This invite link is invalid or has expired.",
          );
          setTokenValid(false);
        } else {
          setEmail(body.data.email);
          setFacilityName(body.data.facilityName);
          setTokenValid(true);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("This invite link is invalid or has expired.");
          setTokenValid(false);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            account_type: "staff",
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
        setError(
          "Check your email to confirm your account, then sign in. If you still can't access the facility, contact your admin.",
        );
        return;
      }

      const acceptResponse = await fetch("/api/staff/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          token,
          userId: data.user.id,
          fullName: trimmedFullName,
        }),
      });

      const acceptBody = (await acceptResponse.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!acceptResponse.ok || acceptBody.ok === false) {
        setError(
          acceptBody.error ?? "Failed to accept invite. Please try again.",
        );
        return;
      }

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
              Join the team
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {facilityName
                ? `Create your staff account for ${facilityName}`
                : "Create your staff account"}
            </p>

            {verifying ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Checking invite...
              </p>
            ) : !tokenValid ? (
              <div className="mt-6 space-y-4">
                <p
                  className="rounded-xl border border-danger/20 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {error ?? "This invite link is invalid or has expired."}
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                />
                <Input
                  label="Full Name"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                {error && (
                  <p
                    className="rounded-xl border border-danger/20 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create staff account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function StaffSignupPage() {
  return (
    <Suspense fallback={<StaffSignupFallback />}>
      <StaffSignupContent />
    </Suspense>
  );
}
