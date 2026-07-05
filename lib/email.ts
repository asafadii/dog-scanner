export function buildInviteEmailHtml({
  clientName,
  facilityName,
  signupUrl,
}: {
  clientName: string;
  facilityName: string;
  signupUrl: string;
}): string {
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
            You're invited!
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#17211D;line-height:1.6;">
            Hi ${clientName},<br><br>
            <strong>${facilityName}</strong> has invited you to manage
            your dog's bookings and profile on hello DORA.
          </p>
          <a href="${signupUrl}"
             style="display:inline-block;background:#077D73;color:#ffffff;
                    font-size:15px;font-weight:700;padding:14px 28px;
                    border-radius:10px;text-decoration:none;">
            Create your account →
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#6E7A75;line-height:1.5;">
            This link is personal and pre-fills your signup details.
            If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
