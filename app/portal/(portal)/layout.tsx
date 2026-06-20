"use client";

import { RequireClientAccount } from "@/components/portal/RequireClientAccount";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Heart, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function PortalAuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const displayName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "Client";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <RequireClientAccount>
      <div className="flex min-h-full flex-col bg-[#F5F3FF]">
        <header className="border-b border-violet-200/60 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-violet-700 transition-colors hover:text-violet-800"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <Heart className="h-5 w-5" aria-hidden />
              </span>
              <div className="leading-tight">
                <span className="block text-lg font-semibold tracking-tight">
                  DORA Portal
                </span>
                <span className="block text-xs text-stone-500">
                  {displayName}
                </span>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </RequireClientAccount>
  );
}
