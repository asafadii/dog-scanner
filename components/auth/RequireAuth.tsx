"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-background">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
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

  return <>{children}</>;
}
