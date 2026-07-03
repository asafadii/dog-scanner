import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DORA Portal",
  icons: {
    icon: "/favicon-portal.svg",
  },
};

export default function PortalRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
