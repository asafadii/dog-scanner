import { BookingDetailView } from "@/components/bookings/BookingDetailView";

interface BookingDetailPageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { bookingId } = await params;
  return <BookingDetailView bookingId={bookingId} />;
}
