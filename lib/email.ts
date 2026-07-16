function emailButton(href: string, label: string): string {
  return `<a href="${href}"
     style="display:inline-block;background:#077D73;color:#ffffff;
            font-size:15px;font-weight:700;padding:14px 28px;
            border-radius:10px;text-decoration:none;">
    ${label}
  </a>`;
}

function emailFooter(note: string): string {
  return `<p style="margin:24px 0 0;font-size:13px;color:#6E7A75;line-height:1.5;">${note}</p>`;
}

function emailShell(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#FAFAF8;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
      <div style="max-width:480px;margin:48px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #EDEBE6;">
        <div style="background:#077D73;padding:32px 32px 24px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
            hello DORA 🐾
          </p>
        </div>
        <div style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#06342F;">
            ${title}
          </h1>
          ${body}
        </div>
      </div>
    </body>
    </html>
  `;
}

export function formatEmailDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function buildInviteEmailHtml({
  clientName,
  facilityName,
  signupUrl,
}: {
  clientName: string;
  facilityName: string;
  signupUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName},<br><br>
      <strong>${facilityName}</strong> has invited you to manage
      your dog's bookings and profile on hello DORA.
    </p>
    ${emailButton(signupUrl, "Create your account →")}
    ${emailFooter(
      "This link is personal and pre-fills your signup details. If you didn't expect this email, you can safely ignore it.",
    )}
  `;

  return emailShell("You're invited!", body);
}

export function buildBookingConfirmationHtml({
  clientName,
  dogName,
  facilityName,
  serviceType,
  startDate,
  endDate,
  portalUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  serviceType: "daycare" | "boarding";
  startDate: string;
  endDate: string;
  portalUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName}, your booking for <strong>${dogName}</strong> at
      <strong>${facilityName}</strong> has been received and is pending approval.
      We'll notify you once it's reviewed.
    </p>
    ${emailButton(portalUrl, "View your booking →")}
    ${emailFooter(
      `Service: ${serviceType} · ${startDate} – ${endDate}`,
    )}
  `;

  return emailShell("Booking received", body);
}

export function buildBookingApprovedHtml({
  clientName,
  dogName,
  facilityName,
  startDate,
  endDate,
  portalUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  startDate: string;
  endDate: string;
  portalUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName}, great news! <strong>${dogName}</strong>'s booking at
      <strong>${facilityName}</strong> has been approved.
    </p>
    ${emailButton(portalUrl, "View booking →")}
    ${emailFooter(`${startDate} – ${endDate}`)}
  `;

  return emailShell("Booking confirmed!", body);
}

export function buildBookingRejectedHtml({
  clientName,
  dogName,
  facilityName,
  portalUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  portalUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName}, unfortunately <strong>${dogName}</strong>'s booking request
      at <strong>${facilityName}</strong> could not be approved at this time.
      Please contact the facility directly for more information or to discuss
      alternatives.
    </p>
    ${emailButton(portalUrl, "View portal →")}
  `;

  return emailShell("Booking update", body);
}

export function buildBookingReminderHtml({
  clientName,
  dogName,
  facilityName,
  startDate,
  portalUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  startDate: string;
  portalUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName}, just a reminder that <strong>${dogName}</strong> is booked
      in at <strong>${facilityName}</strong> tomorrow, ${startDate}. See you then!
    </p>
    ${emailButton(portalUrl, "View booking →")}
  `;

  return emailShell("Visit reminder", body);
}

export function buildStaffInviteHtml({
  facilityName,
  signupUrl,
}: {
  facilityName: string;
  signupUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      You&apos;ve been invited to join the team at <strong>${facilityName}</strong>
      on hello DORA. Click below to create your staff account.
    </p>
    ${emailButton(signupUrl, "Accept invite →")}
    ${emailFooter(
      "This link is personal. If you didn't expect this email, you can safely ignore it.",
    )}
  `;

  return emailShell(`You're invited to join ${facilityName}`, body);
}
