import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type LandingButtonVariant = "primary" | "secondary" | "outline" | "inverted";

interface LandingButtonBaseProps {
  variant?: LandingButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

type LandingButtonAsButton = LandingButtonBaseProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

type LandingButtonAsLink = LandingButtonBaseProps &
  ComponentPropsWithoutRef<typeof Link> & { href: string };

type LandingButtonProps = LandingButtonAsButton | LandingButtonAsLink;

const variantClasses: Record<LandingButtonVariant, string> = {
  primary:
    "bg-[oklch(0.531_0.092_185.0)] text-white hover:bg-[oklch(0.481_0.092_185.0)]",
  secondary:
    "bg-[oklch(0.828_0.050_180.2)] text-[oklch(0.205_0.006_89.9)] hover:bg-[oklch(0.798_0.050_180.2)]",
  outline:
    "border border-[oklch(0.885_0.000_89.9)] bg-white text-[oklch(0.205_0.006_89.9)] hover:bg-[oklch(0.985_0_0)]",
  inverted:
    "bg-white text-[oklch(0.531_0.092_185.0)] hover:bg-[oklch(0.985_0_0)]",
};

const sizeClasses = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export function LandingButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LandingButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.531_0.092_185.0)] focus-visible:ring-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ComponentPropsWithoutRef<"button">;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
