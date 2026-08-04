import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { processJobs } from "@/lib/jobs";
import { sendNotificationJobHandler } from "@/lib/notifications";
import { deliverWebhookJobHandler } from "@/lib/webhooks";

function secretsMatch(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers must be equal length for timingSafeEqual — pad rather than
  // short-circuit on length, which itself would leak length via timing.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Machine-to-machine endpoint, not user-facing — protected by a shared
 * secret header rather than Clerk auth. Invoked on a schedule by
 * .github/workflows/process-jobs.yml since this app has no standalone
 * worker process. */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_JOB_SECRET not configured" }, { status: 503 });
  }

  const provided = req.headers.get("x-internal-secret");
  if (!provided || !secretsMatch(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processJobs({
    send_notification: sendNotificationJobHandler,
    deliver_webhook: deliverWebhookJobHandler,
  });

  return NextResponse.json(result);
}
