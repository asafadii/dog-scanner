import { ScanCheckin } from "@/components/checkins/ScanCheckin";
import Link from "next/link";

export default function ScanCheckinPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/checkins"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to Check-ins
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          Scan to Check In
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan a client&apos;s QR code or enter their check-in code manually.
        </p>
      </div>

      <ScanCheckin />
    </div>
  );
}
