"use client";

import { Button } from "@/components/ui/Button";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eye, Mail, PawPrint, Phone, User } from "lucide-react";
import Link from "next/link";

interface ClientCardProps {
  client: Client;
  className?: string;
}

export function ClientCard({ client, className }: ClientCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      aria-label={`${client.name}, client`}
    >
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.950_0.020_185.0)] to-amber-50">
          <User className="h-7 w-7 text-[oklch(0.531_0.092_185.0)]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold leading-tight text-stone-900">
            {client.name}
          </h3>
          <div className="mt-1 space-y-0.5 text-sm text-stone-500">
            {client.phone && (
              <p className="flex items-center gap-1.5 truncate">
                <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden />
                {client.phone}
              </p>
            )}
            {client.email && (
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden />
                {client.email}
              </p>
            )}
          </div>
          {(client.dogCount ?? 0) > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[oklch(0.480_0.085_185.0)]">
              <PawPrint className="h-3.5 w-3.5" aria-hidden />
              {client.dogCount} {client.dogCount === 1 ? "dog" : "dogs"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-3">
        <Link href={`/clients/${client.id}`}>
          <Button variant="outline" size="md" className="w-full">
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
            View Client
          </Button>
        </Link>
      </div>
    </article>
  );
}
