"use client";

import { FacilityAccessProvider } from "@/components/app/FacilityAccessContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getCurrentUserProfile } from "@/lib/dogs";
import { getSubscriptionInfo } from "@/lib/subscription";
import type { UserRole } from "@/lib/supabase/types";
import type { SubscriptionInfo } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [subscriptionFailed, setSubscriptionFailed] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscriptionLoading(false);
      setSubscriptionInfo(null);
      setSubscriptionFailed(false);
      setRole(null);
      return;
    }

    let cancelled = false;
    setSubscriptionLoading(true);
    setSubscriptionFailed(false);

    void Promise.all([getSubscriptionInfo(), getCurrentUserProfile()]).then(
      ([subscriptionResult, profileResult]) => {
        if (cancelled) return;

        if (profileResult.data) {
          setRole(profileResult.data.role);
        } else {
          setRole(null);
        }

        if (subscriptionResult.error) {
          setSubscriptionFailed(true);
          setSubscriptionInfo(null);
        } else {
          setSubscriptionInfo(subscriptionResult.data);
          setSubscriptionFailed(false);
        }
        setSubscriptionLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const onSubscriptionPage = pathname.startsWith("/subscription");
  const needsSubscriptionRedirect =
    Boolean(user) &&
    !subscriptionLoading &&
    !subscriptionFailed &&
    subscriptionInfo !== null &&
    !onSubscriptionPage &&
    (subscriptionInfo.stripeCustomerId === null ||
      subscriptionInfo.accessLevel === "blocked");

  useEffect(() => {
    if (!needsSubscriptionRedirect) return;
    router.push("/subscription");
  }, [needsSubscriptionRedirect, router]);

  if (loading) {
    return <AuthLoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="flex items-center gap-2">
              <Image
                src="/dora-icon.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                aria-hidden
              />
              <span className="font-display text-xl font-bold text-primary">
                DORA
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              Please log in
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You must be signed in to access DORA.
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

  if (subscriptionLoading || needsSubscriptionRedirect) {
    return <AuthLoadingSpinner />;
  }

  return (
    <FacilityAccessProvider
      value={{
        accessLevel: subscriptionInfo?.accessLevel ?? "full",
        daysUntilBlocked: subscriptionInfo?.daysUntilBlocked ?? null,
        role,
        loading: false,
      }}
    >
      {children}
    </FacilityAccessProvider>
  );
}
