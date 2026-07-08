import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/dora-icon.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
        priority
      />
      <span
        className="font-display font-bold leading-none text-primary"
        style={{ fontSize: size * 0.625 }}
      >
        hello DORA
      </span>
    </div>
  );
}
