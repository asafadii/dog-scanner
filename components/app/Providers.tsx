"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { MockStoreProvider } from "@/lib/mockStore";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MockStoreProvider>{children}</MockStoreProvider>
    </AuthProvider>
  );
}
