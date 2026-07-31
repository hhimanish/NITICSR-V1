import { NextResponse } from "next/server";

import { getPool } from "@/lib/db";

/** Public, unauthenticated — for uptime monitors/load balancer health
 * checks, not for humans. Checks the one dependency that actually matters:
 * can we reach Postgres. Doesn't check Cerebras/Resend/Clerk since those
 * failing shouldn't mark the whole app "down" (see docs/RUNBOOK.md). */
export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check: database unreachable", error);
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
