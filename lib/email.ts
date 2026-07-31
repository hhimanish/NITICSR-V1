import { Resend } from "resend";
import type { LeadInput } from "@/lib/db";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM_ADDRESS = process.env.CONTACT_FROM_EMAIL || "NITICSR <onboarding@resend.dev>";

/** Throws if Resend isn't configured or delivery fails — used by the job
 * queue, which needs a real failure to retry against, unlike the
 * best-effort contact-form senders below. */
export async function sendEmail(to: string, subject: string, text: string) {
  const client = getResend();
  if (!client) throw new Error("RESEND_API_KEY is not set");
  await client.emails.send({ from: FROM_ADDRESS, to, subject, text });
}

/** Best-effort — callers should not fail the request if email delivery fails. */
export async function sendContactConfirmation(input: LeadInput) {
  const client = getResend();
  if (!client) return;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: input.email,
    subject: "We received your message — NITICSR",
    text: `Hi ${input.name},\n\nThanks for reaching out to NITICSR. Our team will get back to you shortly.\n\n— NITICSR`,
  });
}

export async function sendInternalNotification(input: LeadInput) {
  const client = getResend();
  const notifyAddress = process.env.CONTACT_NOTIFY_EMAIL;
  if (!client || !notifyAddress) return;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: notifyAddress,
    subject: `New contact form lead: ${input.name}`,
    text: `Name: ${input.name}\nEmail: ${input.email}\nOrganization: ${input.organization || "—"}\n\nMessage:\n${input.message}`,
  });
}
