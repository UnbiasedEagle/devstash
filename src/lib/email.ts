import { Resend } from "resend";
import { emailEnv } from "@/lib/env";

const resend = new Resend(emailEnv.RESEND_API_KEY);

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const { error } = await resend.emails.send({
    from: emailEnv.EMAIL_FROM,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Could not send email: ${error.message}`);
  }
}
