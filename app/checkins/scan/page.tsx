import { ScanCheckin } from "@/components/checkins/ScanCheckin";
import Link from "next/link";

export default async function ScanCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawToken = params.token;
  const initialToken =
    typeof rawToken === "string"
      ? rawToken
      : Array.isArray(rawToken)
        ? (rawToken[0] ?? null)
        : null;

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

      <ScanCheckin initialToken={initialToken} />
    </div>
  );
}
