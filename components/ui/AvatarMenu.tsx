"use client";

import { cn } from "@/lib/utils";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export interface AvatarMenuProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Avatar trigger contents — initials, image, or icon. */
  avatar?: ReactNode;
  /** Dropdown panel contents (menu items). */
  children?: ReactNode;
  panelClassName?: string;
}

export function AvatarMenu({
  className,
  panelClassName,
  avatar,
  children,
  ...props
}: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-semibold text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
          className,
        )}
        {...props}
      >
        {avatar}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
