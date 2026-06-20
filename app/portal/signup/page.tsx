"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { claimClientAccount } from "@/lib/portal/claim";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function PortalSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const trimmedInviteCode = inviteCode.trim().toUpperCase();

    if (!trimmedInviteCode) {
      setError("Invite code is required.");
      setLoading(false);
      return;
    }

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
          "Check your email to confirm your account. After you confirm and sign in, enter your invite code on the portal to link your profile.",
        );
        return;
      }

      await claimClientAccount(data.session.access_token, trimmedInviteCode);

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
    <div className="flex min-h-full flex-col bg-[#F5F3FF]">
      <header className="border-b border-violet-200/60 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-violet-700 transition-colors hover:text-violet-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Heart className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              DORA Portal
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Create client account
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Sign up to manage your dogs at your daycare
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
              <Input
                label="Invite Code"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="From your daycare"
                autoComplete="off"
              />

              {error && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {info && (
                <p
                  className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800"
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

            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-violet-600 hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-3 text-center text-sm text-stone-500">
              Staff member?{" "}
              <Link
                href="/signup"
                className="font-medium text-teal-600 hover:underline"
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
