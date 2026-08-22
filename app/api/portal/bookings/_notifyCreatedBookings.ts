import { sendTransactionalEmail } from "@/app/api/_lib/sendEmail";
import {
  buildBatchBookingApprovedHtml,
  buildBatchBookingConfirmationHtml,
  buildBookingApprovedHtml,
  buildBookingConfirmationHtml,
  buildFacilityAutoApprovedBookingHtml,
  buildFacilityBatchAutoApprovedBookingHtml,
  buildFacilityBatchNewBookingRequestHtml,
  buildFacilityNewBookingRequestHtml,
  formatEmailDate,
} from "@/lib/email";
import type { Booking } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hellodora.app";

export async function sendEmailsForCreatedBookings({
  group,
  approved,
  clientRow,
  facilityName,
  clientNameForEmail,
  adminEmails,
  notifyFacility,
  patternLabel,
}: {
  group: Booking[];
  approved: boolean;
  clientRow: { name: string; email: string | null } | null;
  facilityName: string;
  clientNameForEmail: string;
  adminEmails: string[];
  notifyFacility: boolean;
  patternLabel?: string;
}): Promise<void> {
  if (group.length === 0) return;

  const first = group[0];
  const dates = group.map((booking) => ({
    startDate: booking.startDate,
    endDate: booking.endDate,
  }));
  const singular = group.length === 1;

  if (clientRow?.email?.trim()) {
    if (singular) {
      const startDateFormatted = formatEmailDate(first.startDate);
      const endDateFormatted = formatEmailDate(first.endDate);
      const portalUrl = `${APP_URL}/portal/bookings/${first.id}`;

      if (approved) {
        await sendTransactionalEmail({
          to: clientRow.email,
          subject: `🎉🐾 ${first.dogName}'s booking is officially confirmed!`,
          html: buildBookingApprovedHtml({
            clientName: clientRow.name,
            dogName: first.dogName,
            facilityName,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            portalUrl,
          }),
        });
      } else {
        await sendTransactionalEmail({
          to: clientRow.email,
          subject: `Booking received for ${first.dogName} 🐾`,
          html: buildBookingConfirmationHtml({
            clientName: clientRow.name,
            dogName: first.dogName,
            facilityName,
            serviceType: first.serviceType,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            portalUrl,
          }),
        });
      }
    } else if (approved) {
      await sendTransactionalEmail({
        to: clientRow.email,
        subject: `${group.length} bookings confirmed for ${first.dogName}! 🎉`,
        html: buildBatchBookingApprovedHtml({
          clientName: clientRow.name,
          dogName: first.dogName,
          facilityName,
          dates,
          portalUrl: `${APP_URL}/portal/bookings`,
          patternLabel,
        }),
      });
    } else {
      await sendTransactionalEmail({
        to: clientRow.email,
        subject: `${group.length} bookings received for ${first.dogName} 🐾`,
        html: buildBatchBookingConfirmationHtml({
          clientName: clientRow.name,
          dogName: first.dogName,
          facilityName,
          serviceType: first.serviceType,
          dates,
          portalUrl: `${APP_URL}/portal/bookings`,
          patternLabel,
        }),
      });
    }
  }

  if (adminEmails.length === 0 || !notifyFacility) return;

  if (singular) {
    const startDateFormatted = formatEmailDate(first.startDate);
    const endDateFormatted = formatEmailDate(first.endDate);
    const bookingUrl = `${APP_URL}/bookings/${first.id}`;
    const html = approved
      ? buildFacilityAutoApprovedBookingHtml({
          dogName: first.dogName,
          clientName: clientNameForEmail,
          serviceType: first.serviceType,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          bookingUrl,
        })
      : buildFacilityNewBookingRequestHtml({
          dogName: first.dogName,
          clientName: clientNameForEmail,
          serviceType: first.serviceType,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          bookingUrl,
        });

    for (const email of adminEmails) {
      await sendTransactionalEmail({
        to: email,
        subject: approved
          ? `Booking auto-confirmed for ${first.dogName}`
          : `New booking request for ${first.dogName}`,
        html,
      });
    }
    return;
  }

  const html = approved
    ? buildFacilityBatchAutoApprovedBookingHtml({
        dogName: first.dogName,
        clientName: clientNameForEmail,
        serviceType: first.serviceType,
        dates,
        bookingUrl: `${APP_URL}/bookings`,
        patternLabel,
      })
    : buildFacilityBatchNewBookingRequestHtml({
        dogName: first.dogName,
        clientName: clientNameForEmail,
        serviceType: first.serviceType,
        dates,
        bookingUrl: `${APP_URL}/bookings`,
        patternLabel,
      });

  for (const email of adminEmails) {
    await sendTransactionalEmail({
      to: email,
      subject: approved
        ? `${group.length} bookings auto-confirmed for ${first.dogName}`
        : `${group.length} new booking requests for ${first.dogName}`,
      html,
    });
  }
}
