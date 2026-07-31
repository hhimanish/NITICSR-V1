import { getPool } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { enqueueJob } from "@/lib/jobs";

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push" | "slack" | "teams" | "webhook";

/** Channels with a real, working send implementation. Everything else in
 * NotificationChannel is modeled in the schema so the data layer is ready,
 * but isn't wired to a real provider — SMS/WhatsApp/push/Slack/Teams/webhook
 * all require accounts and credentials this project doesn't have yet. Faking
 * them would just be code that looks like it works and doesn't. */
const LIVE_CHANNELS: NotificationChannel[] = ["email"];

type NotificationTemplate = { subject: string; text: string };

const TEMPLATES: Record<string, (payload: Record<string, unknown>) => NotificationTemplate> = {
  verification_submitted: (p) => ({
    subject: `Verification requested for ${p.ngoName}`,
    text: `A verification request has been submitted for ${p.ngoName}.`,
  }),
  verification_reviewed: (p) => ({
    subject: `Verification ${p.status} — ${p.ngoName}`,
    text: `Your verification request for ${p.ngoName} is now "${p.status}".${
      p.reviewNotes ? `\n\nReviewer notes: ${p.reviewNotes}` : ""
    }`,
  }),
};

type QueueNotificationInput = {
  recipientUserId?: string;
  recipientEmail: string;
  channel?: NotificationChannel;
  templateKey: keyof typeof TEMPLATES;
  payload?: Record<string, unknown>;
};

/** Queues a notification row and a "send_notification" job to deliver it —
 * see .github/workflows/process-jobs.yml for what actually invokes the
 * job processor on a schedule. */
export async function queueNotification(input: QueueNotificationInput) {
  const channel = input.channel ?? "email";
  const { rows } = await getPool().query(
    `INSERT INTO notifications (recipient_user_id, recipient_email, channel, template_key, payload)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [input.recipientUserId ?? null, input.recipientEmail, channel, input.templateKey, JSON.stringify(input.payload ?? {})]
  );
  const notificationId = rows[0].id as string;
  await enqueueJob("send_notification", { notificationId });
  return notificationId;
}

/** Job handler for job_type "send_notification". Registered with
 * processJobs() in app/api/internal/process-jobs/route.ts. */
export async function sendNotificationJobHandler(payload: Record<string, unknown>) {
  const notificationId = payload.notificationId as string;
  const pool = getPool();

  const { rows } = await pool.query(`SELECT * FROM notifications WHERE id = $1`, [notificationId]);
  const notification = rows[0];
  if (!notification) throw new Error(`Notification ${notificationId} not found`);

  if (!LIVE_CHANNELS.includes(notification.channel)) {
    await pool.query(
      `UPDATE notifications SET status = 'failed', error_message = $2 WHERE id = $1`,
      [notificationId, `No live provider for channel "${notification.channel}" yet`]
    );
    return;
  }

  const template = TEMPLATES[notification.template_key as keyof typeof TEMPLATES];
  if (!template) throw new Error(`Unknown template_key "${notification.template_key}"`);

  const { subject, text } = template(notification.payload);
  await sendEmail(notification.recipient_email, subject, text);

  await pool.query(`UPDATE notifications SET status = 'sent', sent_at = now() WHERE id = $1`, [
    notificationId,
  ]);
}
