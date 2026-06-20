"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  INCOMPLETE_CLIENT_SETUP_MESSAGE,
  requireClientAccount,
} from "@/lib/portal/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface RequireClientAccountProps {
  children: ReactNode;
}

export function RequireClientAccount({ children }: RequireClientAccountProps) {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setChecking(false);
      setAllowed(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const accountResult = await requireClientAccount();
      if (accountResult.data) {
        if (!cancelled) {
          setChecking(false);
          setAllowed(true);
          setErrorCode(null);
        }
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const isPortalSignup =
        authUser?.user_metadata?.account_type === "client";

      if (cancelled) return;
      setChecking(false);
      if (isPortalSignup) {
        setAllowed(true);
        setErrorCode(null);
      } else {
        setAllowed(false);
        setErrorCode(accountResult.error?.code ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#F5F3FF]">
        <Loader2
          className="h-8 w-8 animate-spin text-violet-600"
          aria-hidden
        />
        <p className="text-sm text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F3FF] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Heart className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">
              Please log in
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Sign in to access your client portal.
            </p>
            <Link href="/login" className="mt-6 w-full">
              <Button size="lg" className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allowed && errorCode === "incomplete_setup") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F3FF] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <h2 className="text-xl font-semibold text-stone-900">
              Account not ready
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              {INCOMPLETE_CLIENT_SETUP_MESSAGE}
            </p>
            <Link href="/portal/signup" className="mt-6 w-full">
              <Button size="lg" className="w-full">
                Create Client Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F3FF] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <p className="text-sm text-red-800" role="alert">
              Unable to verify your client account. Please try again.
            </p>
            <Link href="/login" className="mt-6 w-full">
              <Button variant="outline" size="lg" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
