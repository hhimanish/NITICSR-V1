import { NextRequest, NextResponse } from "next/server";

import { processJobs } from "@/lib/jobs";
import { sendNotificationJobHandler } from "@/lib/notifications";

/** Machine-to-machine endpoint, not user-facing — protected by a shared
 * secret header rather than Clerk auth. Invoked on a schedule by
 * .github/workflows/process-jobs.yml since this app has no standalone
 * worker process. */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_JOB_SECRET not configured" }, { status: 503 });
  }

  if (req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processJobs({
    send_notification: sendNotificationJobHandler,
  });

  return NextResponse.json(result);
}
