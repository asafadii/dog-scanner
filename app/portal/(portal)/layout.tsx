"use client";

import { PortalShell } from "@/components/portal/PortalShell";
import { RequireClientAccount } from "@/components/portal/RequireClientAccount";
import { useAuth } from "@/components/auth/AuthProvider";
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
      <PortalShell
        displayName={displayName}
        onSignOut={() => void handleSignOut()}
      >
        {children}
      </PortalShell>
    </RequireClientAccount>
  );
}
