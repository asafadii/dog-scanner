import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Home,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/checkins", label: "Check-ins", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function isActiveNav(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    (href === "/bookings" && pathname.startsWith("/bookings")) ||
    (href === "/reports" && pathname.startsWith("/reports")) ||
    (href === "/checkins" && pathname.startsWith("/checkins"))
  );
}
