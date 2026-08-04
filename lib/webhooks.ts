import { createHmac, randomBytes } from "node:crypto";

import { getPool } from "@/lib/db";
import { enqueueJob } from "@/lib/jobs";
import { logger } from "@/lib/logger";
import type { WEBHOOK_EVENT_TYPES } from "@/lib/schemas-v1";

/**
 * Outbound webhooks (ERT 12) — finishing `webhooks`, dormant since Phase 2.
 * Delivery reuses the existing Postgres job queue (`lib/jobs.ts`) rather
 * than a new dispatch system, the same retry/backoff/dead-letter behavior
 * `lib/notifications.ts` already relies on.
 */

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export async function createWebhook(organizationId: string, url: string, eventTypes: WebhookEventType[]) {
  const secret = randomBytes(24).toString("hex");
  const { rows } = await getPool().query(
    `INSERT INTO webhooks (organization_id, url, event_types, secret_hash, secret)
     VALUES ($1, $2, $3, '', $4)
     RETURNING id, url, event_types, is_active, created_at`,
    [organizationId, url, eventTypes, secret]
  );
  return { ...rows[0], secret };
}

export async function listWebhooks(organizationId: string) {
  const { rows } = await getPool().query(
    `SELECT id, url, event_types, is_active, created_at
       FROM webhooks
      WHERE organization_id = $1
      ORDER BY created_at DESC`,
    [organizationId]
  );
  return rows;
}

export async function revokeWebhook(id: string, organizationId: string) {
  const { rows } = await getPool().query(
    `UPDATE webhooks SET is_active = false, updated_at = now()
      WHERE id = $1 AND organization_id = $2 AND is_active
      RETURNING id`,
    [id, organizationId]
  );
  return rows.length > 0;
}

/** Enqueues one delivery job per active, subscribed webhook — called from
 * the real event point (e.g. csr-projects/[id]/route.ts on approval), not
 * a generic event bus (Phase 6/ERT2 already declined building one without
 * a concrete backlog of events). */
export async function triggerWebhookEvent(
  eventType: WebhookEventType,
  organizationId: string,
  payload: Record<string, unknown>
) {
  const { rows } = await getPool().query(
    `SELECT id FROM webhooks
      WHERE organization_id = $1 AND is_active AND $2 = ANY(event_types)`,
    [organizationId, eventType]
  );

  for (const row of rows) {
    await enqueueJob("deliver_webhook", { webhookId: row.id, eventType, payload });
  }
}

/** Job handler for job_type "deliver_webhook". Registered with
 * processJobs() in app/api/internal/process-jobs/route.ts. Throwing lets
 * the existing job queue's exponential backoff and dead-lettering handle
 * retries — no bespoke retry logic here. */
export async function deliverWebhookJobHandler(payload: Record<string, unknown>) {
  const webhookId = payload.webhookId as string;
  const { rows } = await getPool().query(`SELECT * FROM webhooks WHERE id = $1`, [webhookId]);
  const webhook = rows[0];
  if (!webhook || !webhook.is_active) {
    logger.info("Skipping delivery for inactive/deleted webhook", { webhookId });
    return;
  }

  const body = JSON.stringify({ eventType: payload.eventType, data: payload.payload });
  const signature = createHmac("sha256", webhook.secret).update(body).digest("hex");

  const res = await fetch(webhook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-NITICSR-Signature": signature,
      "X-NITICSR-Event": String(payload.eventType),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Webhook delivery to ${webhook.url} failed with status ${res.status}`);
  }
}
