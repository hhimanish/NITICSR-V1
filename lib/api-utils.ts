import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { ForbiddenError } from "@/lib/rbac";

export function paginationParams(searchParams: URLSearchParams) {
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? null });
}

export function apiError(status: number, message: string, issues?: unknown) {
  return NextResponse.json({ error: message, issues: issues ?? null }, { status });
}

/** Wraps a route handler with consistent error translation: Zod validation
 * errors become 400s, ForbiddenError becomes a 403, anything unexpected
 * becomes a logged 500 rather than leaking internals to the client. */
export function withApiErrors<Ctx = unknown>(
  handler: (req: NextRequest, ctx: Ctx) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(400, "Invalid request", error.issues);
      }
      if (error instanceof ForbiddenError) {
        return apiError(403, error.message);
      }
      console.error("Unhandled API error", error);
      return apiError(500, "Internal server error");
    }
  };
}
