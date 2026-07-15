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
        className="font-display leading-none text-primary tracking-tight"
        style={{ fontSize: size * 0.5 }}
      >
        <span className="font-medium opacity-80">hello</span>{" "}
        <span className="font-bold">DORA</span>
      </span>
    </div>
  );
}
