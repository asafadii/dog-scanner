"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { resolvePostLoginDestination, shouldRunStaffAuthSetup } from "@/lib/authRedirect";
import { runAuthSetup } from "@/lib/authSetup";
import { getCurrentUserProfile } from "@/lib/dogs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Dog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: trimmedEmail,
          password,
        },
      );

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setError("Sign in succeeded but no session was returned. Please try again.");
        return;
      }

      const profileResult = await getCurrentUserProfile();
      if (
        profileResult.error?.code === "incomplete_setup" &&
        (await shouldRunStaffAuthSetup())
      ) {
        await runAuthSetup(accessToken, { email: trimmedEmail });
      }

      const destination = await resolvePostLoginDestination();
      router.push(destination);
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
    <div className="flex min-h-full flex-col bg-[#FAFAF8]">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-teal-700 transition-colors hover:text-teal-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Dog className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Dog Scanner
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Sign in as staff or client
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@facility.com"
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              {error && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500">
              Facility staff?{" "}
              <Link
                href="/signup"
                className="font-medium text-teal-600 hover:underline"
              >
                Create facility account
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-stone-500">
              Dog owner?{" "}
              <Link
                href="/portal/signup"
                className="font-medium text-violet-600 hover:underline"
              >
                Client portal signup
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
