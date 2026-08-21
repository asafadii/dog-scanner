import { BookingDetailView } from "@/components/bookings/BookingDetailView";

interface BookingDetailPageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ updated?: string; skipped?: string }>;
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingDetailPageProps) {
  const { bookingId } = await params;
  const query = await searchParams;
  const updatedCount = query.updated !== undefined ? Number(query.updated) : NaN;
  const skippedCount = query.skipped !== undefined ? Number(query.skipped) : 0;
  const seriesEditResult = Number.isFinite(updatedCount)
    ? {
        updatedCount,
        skippedCount: Number.isFinite(skippedCount) ? skippedCount : 0,
      }
    : null;

  return (
    <BookingDetailView
      bookingId={bookingId}
      seriesEditResult={seriesEditResult}
    />
  );
}
