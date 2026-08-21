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
      Big news — <strong>${facilityName}</strong> just added you to
      their pack on hello DORA, which means you're one click away
      from never digging through old text threads to remember when
      your dog's next stay is.<br><br>
      Here's what you'll be able to do once you're in:
      <ul style="margin:12px 0;padding-left:20px;">
        <li>See every upcoming booking for your dog, at a glance</li>
        <li>Update their profile — allergies, quirks, favourite
        snacks, the important stuff</li>
        <li>Get a heads-up the day before every stay</li>
      </ul>
      No paperwork, no phone tag — just tap below and you'll be in.
    </p>
    ${emailButton(signupUrl, "Create your account →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Wags & wiggles,<br>The hello DORA Pack 🐾
    </p>
    ${emailFooter(
      "This link is personal and already knows who you are — no forms to fill in twice. If this landed in your inbox by mistake, feel free to ignore it, no hard feelings (or paws).",
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
      Hi ${clientName},<br><br>
      Consider this your official "message received" bark —
      <strong>${dogName}</strong>'s booking at
      <strong>${facilityName}</strong> has landed safely in our inbox
      and is waiting for a paws-up from the team.<br><br>
      <strong>Service:</strong> ${serviceType}<br>
      <strong>Dates:</strong> ${startDate} – ${endDate}<br><br>
      We'll email you the moment it's reviewed.
    </p>
    ${emailButton(portalUrl, "View your booking →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Talk soon,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Booking received!", body);
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
      Hi ${clientName},<br><br>
      Great news travels fast: <strong>${dogName}</strong>'s booking
      at <strong>${facilityName}</strong> is officially
      <strong>confirmed</strong>. Pawsitively locked in.<br><br>
      📅 ${startDate} – ${endDate}<br><br>
      Nothing left for you to do — just count down the sleeps until
      drop-off.
    </p>
    ${emailButton(portalUrl, "View booking →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      See you both soon,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("You're all set! 🎉", body);
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
      Hi ${clientName},<br><br>
      Thanks for booking with <strong>${facilityName}</strong> —
      unfortunately, they're not able to confirm
      <strong>${dogName}</strong>'s booking request at this time.
      <br><br>
      This is usually about timing or availability rather than
      anything to do with your pup. The best next step is to reach
      out to ${facilityName} directly — they'll be able to explain
      and help find a time that works.
    </p>
    ${emailButton(portalUrl, "View portal →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      We're still glad you're here,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Update on your booking", body);
}

export function buildBookingCancelledByClientHtml({
  dogName,
  clientName,
  facilityName,
  bookingUrl,
}: {
  dogName: string;
  clientName: string;
  facilityName: string;
  bookingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi there,<br><br>
      <strong>${clientName}</strong> has cancelled
      <strong>${dogName}</strong>'s upcoming booking at
      <strong>${facilityName}</strong>. No action needed on your end —
      just letting you know so your calendar stays accurate.
    </p>
    ${emailButton(bookingUrl, "View bookings →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Booking cancelled", body);
}

export function buildBookingCancelledByFacilityHtml({
  dogName,
  clientName,
  facilityName,
  bookingUrl,
}: {
  dogName: string;
  clientName: string;
  facilityName: string;
  bookingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName},<br><br>
      <strong>${facilityName}</strong> has cancelled
      <strong>${dogName}</strong>'s upcoming booking. If this was
      unexpected, reach out to them directly to find out more or
      reschedule.
    </p>
    ${emailButton(bookingUrl, "View portal →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      We're still glad you're here,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Your booking was cancelled", body);
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
      Hi ${clientName},<br><br>
      Quick nudge: <strong>${dogName}</strong> is booked in at
      <strong>${facilityName}</strong> tomorrow,
      <strong>${startDate}</strong>. Time to dig out the leash and
      pack whatever makes drop-off smoothest — favourite toy, a bit
      of their usual food, anything that'll make them feel at home.
    </p>
    ${emailButton(portalUrl, "View booking →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      See you both soon,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("See you tomorrow! 🐾", body);
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
      Hi there,<br><br>
      <strong>${facilityName}</strong>'s team has invited you to join
      them on hello DORA — the place where all your daycare's
      bookings, dog profiles, and daily check-ins live in one calm,
      tidy place.<br><br>
      Once you're in, you'll be able to check dogs in and out, manage
      bookings, and see everything the rest of the team sees.
    </p>
    ${emailButton(signupUrl, "Accept your invite →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Welcome aboard,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("You're invited to the team", body);
}

export function buildBookingCongratulationsHtml({
  clientName,
  dogName,
  facilityName,
  signupUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  signupUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName},<br><br>
      Congratulations — <strong>${dogName}</strong>'s booking at
      <strong>${facilityName}</strong> has landed safely, tail-wags
      and all! 🎉<br><br>
      There's just one thing left to do: finish setting up your free
      hello DORA account so you can see everything about the booking
      — dates, what's included, and any details ${facilityName} needs
      before drop-off.<br><br>
      It takes about a minute, and we've already got your email on
      file.
    </p>
    ${emailButton(signupUrl, "Finish creating your account →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Welcome to the pack,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Congratulations! 🎉", body);
}

export function buildNewBookingAddedHtml({
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
      Hi ${clientName},<br><br>
      Good news — <strong>${dogName}</strong>'s booking at
      <strong>${facilityName}</strong> has just been added to your
      hello DORA account. No action needed, it's already sitting in
      your bookings, ready whenever you like.
    </p>
    ${emailButton(portalUrl, "View your booking →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("New booking added", body);
}

export function buildFacilityNewBookingRequestHtml({
  dogName,
  clientName,
  serviceType,
  startDate,
  endDate,
  bookingUrl,
}: {
  dogName: string;
  clientName: string;
  serviceType: "daycare" | "boarding";
  startDate: string;
  endDate: string;
  bookingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Heads up — <strong>${dogName}</strong>'s owner
      (${clientName}) just sent in a new booking request, and it's
      waiting on you for a paws-up.<br><br>
      <strong>Service:</strong> ${serviceType}<br>
      <strong>Dates:</strong> ${startDate} – ${endDate}<br><br>
      Take a look and approve or decline whenever you're ready.
    </p>
    ${emailButton(bookingUrl, "Review request →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Wags & wiggles,<br>The hello DORA Pack 🐾
    </p>
  `;
  return emailShell("New booking request", body);
}

export function buildFacilityAutoApprovedBookingHtml({
  dogName,
  clientName,
  serviceType,
  startDate,
  endDate,
  bookingUrl,
}: {
  dogName: string;
  clientName: string;
  serviceType: "daycare" | "boarding";
  startDate: string;
  endDate: string;
  bookingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Just so you're in the loop — <strong>${dogName}</strong>
      (owner: ${clientName}) has a new booking, and since they're a
      returning pup with room on the calendar, it's already been
      auto-confirmed. No action needed on your end.<br><br>
      <strong>Service:</strong> ${serviceType}<br>
      <strong>Dates:</strong> ${startDate} – ${endDate}
    </p>
    ${emailButton(bookingUrl, "View booking →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;
  return emailShell("Booking auto-confirmed", body);
}

export function buildTrialEndingSoonHtml({
  facilityName,
  trialEndsAt,
  billingUrl,
}: {
  facilityName: string;
  trialEndsAt: string;
  billingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi there,<br><br>
      Just a heads up — your hello DORA trial for
      <strong>${facilityName}</strong> ends on
      <strong>${trialEndsAt}</strong>. Add a payment method before
      then to keep everything running without a hitch.
    </p>
    ${emailButton(billingUrl, "Manage billing →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Your trial ends in 7 days", body);
}

export function buildTrialEndedGraceHtml({
  facilityName,
  daysUntilBlocked,
  billingUrl,
}: {
  facilityName: string;
  daysUntilBlocked: number;
  billingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi there,<br><br>
      We tried to charge the card on file for
      <strong>${facilityName}</strong> and it didn't go through. No
      worries yet — you have <strong>${daysUntilBlocked}</strong> more
      days to update your payment method before your account pauses.
      Your data is safe either way.
    </p>
    ${emailButton(billingUrl, "Update payment method →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("We couldn't charge your card", body);
}

export function buildAccessBlockedHtml({
  facilityName,
  billingUrl,
}: {
  facilityName: string;
  billingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi there,<br><br>
      <strong>${facilityName}</strong>'s hello DORA account is now
      paused since we couldn't get a payment through in time. Don't
      worry — nothing has been deleted, your data is exactly as you
      left it. Reactivate anytime to pick up right where you left off.
    </p>
    ${emailButton(billingUrl, "Reactivate →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Your account is paused", body);
}

export function buildPaymentConfirmedHtml({
  facilityName,
  billingUrl,
}: {
  facilityName: string;
  billingUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi there,<br><br>
      Payment for <strong>${facilityName}</strong> went through
      successfully — everything's active and ready to go.
    </p>
    ${emailButton(billingUrl, "View subscription →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
    ${emailFooter(
      "Manage your plan any time from Settings → Subscription.",
    )}
  `;

  return emailShell("You're all set!", body);
}

export function buildVaccinationExpiringOwnerHtml({
  clientName,
  dogName,
  facilityName,
  expiryDate,
  uploadUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  expiryDate: string;
  uploadUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName},<br><br>
      Just a friendly heads-up —
      <strong>${dogName}</strong>'s vaccination record on file with
      <strong>${facilityName}</strong> expires on
      <strong>${expiryDate}</strong>. No rush, but it's a good
      moment to book that check-up if it isn't already on the
      calendar.<br><br>
      Once you have the new stamp in hand, you can upload it
      straight from ${dogName}'s profile — takes less than a
      minute, no emailing PDFs back and forth.
    </p>
    ${emailButton(uploadUrl, "Upload the new stamp →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Wags & wiggles,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Expires in a week 🐾", body);
}

export function buildVaccinationExpiredOwnerHtml({
  clientName,
  dogName,
  facilityName,
  expiryDate,
  uploadUrl,
}: {
  clientName: string;
  dogName: string;
  facilityName: string;
  expiryDate: string;
  uploadUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Hi ${clientName},<br><br>
      <strong>${dogName}</strong>'s vaccination record on file with
      <strong>${facilityName}</strong> expired today,
      <strong>${expiryDate}</strong>. To keep upcoming daycare or
      boarding stays running smoothly, please upload an updated
      vaccination stamp as soon as you can —
      ${facilityName} will be able to see it right away once
      it's in.
    </p>
    ${emailButton(uploadUrl, "Upload the new stamp →")}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      Wags & wiggles,<br>The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Vaccination stamp expired", body);
}

export function buildVaccinationExpiringFacilityHtml({
  dogName,
  clientName,
  expiryDate,
  dogUrl,
}: {
  dogName: string;
  clientName: string;
  expiryDate: string;
  dogUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      Heads up — <strong>${dogName}</strong>'s (${clientName})
      vaccination record is set to expire on
      <strong>${expiryDate}</strong>. The owner has been notified
      by email as well and asked to upload an updated stamp.
      Nothing you need to do right now — just flagging it in
      case it affects an upcoming stay.
    </p>
    ${emailButton(dogUrl, `View ${dogName}'s profile →`)}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Vaccination expiring soon", body);
}

export function buildVaccinationExpiredFacilityHtml({
  dogName,
  clientName,
  expiryDate,
  dogUrl,
}: {
  dogName: string;
  clientName: string;
  expiryDate: string;
  dogUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
      <strong>${dogName}</strong>'s (${clientName}) vaccination
      record expired today, <strong>${expiryDate}</strong>. The
      owner has been notified by email as well and asked to
      upload an updated stamp. You may want to confirm the new
      document is in place before ${dogName}'s next visit.
    </p>
    ${emailButton(dogUrl, `View ${dogName}'s profile →`)}
    <p style="margin:16px 0 0;font-size:15px;color:#17211D;">
      The hello DORA Pack 🐾
    </p>
  `;

  return emailShell("Vaccination expired", body);
}
