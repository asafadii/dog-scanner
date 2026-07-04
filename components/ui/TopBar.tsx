import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  actions?: ReactNode;
}

export function TopBar({
  className,
  brand,
  actions,
  children,
  ...props
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-16 w-full items-center justify-between gap-4 border-b border-border bg-surface px-4",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">{brand}</div>
      {children}
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
