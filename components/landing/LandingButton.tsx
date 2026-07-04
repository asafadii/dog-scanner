import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type LandingButtonVariant = "primary" | "marker" | "outline" | "ghost";

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
    "bg-primary text-white border-[2.5px] border-[#06342F] shadow-[5px_5px_0_#06342F] transition-transform hover:-translate-y-0.5",
  marker:
    "bg-transparent text-[#F2D98A] border-[2.5px] border-[#F2D98A]",
  outline:
    "bg-white text-[#06342F] border-[2.5px] border-[#06342F] shadow-[5px_5px_0_#06342F] transition-transform hover:-translate-y-0.5",
  ghost: "bg-transparent text-[#06342F]",
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
    "inline-flex items-center justify-center font-semibold",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
