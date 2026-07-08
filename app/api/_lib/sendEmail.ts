import { Resend } from "resend";

const FROM_ADDRESS = "hello DORA <info@hellodora.app>";

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[email] RESEND_API_KEY is not configured");
      return;
    }

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Failed to send:", error.message);
    }
  } catch (err) {
    console.error(
      "[email] Failed to send:",
      err instanceof Error ? err.message : err,
    );
  }
}
