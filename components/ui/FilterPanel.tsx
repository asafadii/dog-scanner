"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { appearScale } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface FilterPanelProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeCount: number;
  children: ReactNode;
  className?: string;
}

export function FilterPanel({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeCount,
  children,
  className,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-10"
            aria-label={searchPlaceholder}
          />
        </div>
        <Button
          variant="outline"
          size="md"
          className="relative w-11 min-w-[44px] shrink-0 px-0"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={
            activeCount > 0
              ? `Filters, ${activeCount} active`
              : "Filters"
          }
          onClick={() => setOpen((current) => !current)}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {activeCount > 0 ? (
            <span
              className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
              aria-hidden
            >
              {activeCount}
            </span>
          ) : null}
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="filter-panel"
            id={panelId}
            className="mt-3 w-full"
            {...appearScale}
          >
            <Card>
              <CardContent className="p-4">{children}</CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
