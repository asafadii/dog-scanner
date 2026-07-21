"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { claimClientAccount } from "@/lib/portal/claim";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

function PortalSignupFallback() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-12">
      <p className="text-sm text-muted-foreground">Loading signup...</p>
    </div>
  );
}

function PortalSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  const codeParam = searchParams.get("code");
  const hasInviteParams = Boolean(emailParam || codeParam);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (codeParam) {
      setInviteCode(codeParam.trim().toUpperCase());
    }
  }, [emailParam, codeParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const trimmedInviteCode = inviteCode.trim().toUpperCase();

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            account_type: "client",
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
          trimmedInviteCode
            ? "Check your email to confirm your account. After you confirm and sign in, enter your facility code on the portal to link your profile."
            : "Check your email to confirm your account. After you confirm and sign in, you can link a facility from your portal home page.",
        );
        return;
      }

      if (trimmedInviteCode) {
        await claimClientAccount(data.session.access_token, trimmedInviteCode);
      }

      try {
        await fetch("/api/portal/link-pending", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });
      } catch {
        // best-effort — never block redirect on this
      }

      router.push("/portal");
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
      {/* Mint operational top bar (documented mint-wash literals #EAF4F1 / #D9EAE4), mirrors PortalShell (Plan 05) */}
      <header className="border-b border-[#D9EAE4] bg-[#EAF4F1] backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create client account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up to manage your dogs at your daycare
            </p>

            {hasInviteParams && (
              <p
                className="mt-4 rounded-xl border border-[#D9EAE4] bg-[#EAF4F1] px-4 py-3 text-sm text-primary"
                role="status"
              >
                Your details have been pre-filled from your invite link.
              </p>
            )}

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
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              <div className="space-y-1">
                <Input
                  label="Facility code (optional)"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="From your daycare"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Have a code from your daycare? Enter it here, or add it later from your portal home page.
                </p>
              </div>

              {error && (
                <p
                  className="rounded-xl border border-danger/25 bg-[#FEF2F2] px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {info && (
                // Info notice on the mint operational register (documented mint-wash #EAF4F1 / #D9EAE4)
                <p
                  className="rounded-xl border border-[#D9EAE4] bg-[#EAF4F1] px-4 py-3 text-sm text-primary"
                  role="status"
                >
                  {info}
                </p>
              )}

              {/* Documented portal sticker exception (Plan 05): primary submit CTA only —
                  border 2.5px + shadow 4px 4px 0 #06342F. Nowhere else, never in staff app. */}
              <Button
                type="submit"
                size="lg"
                className="w-full border-[2.5px] border-[#06342F] shadow-[4px_4px_0_#06342F] disabled:shadow-none"
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

            <p className="mt-3 text-center text-sm text-muted-foreground">
              Staff member?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                Facility signup
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function PortalSignupPage() {
  return (
    <Suspense fallback={<PortalSignupFallback />}>
      <PortalSignupContent />
    </Suspense>
  );
}
