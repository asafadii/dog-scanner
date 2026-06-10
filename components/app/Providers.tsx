"use client";

import { MockStoreProvider } from "@/lib/mockStore";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <MockStoreProvider>{children}</MockStoreProvider>;
}
