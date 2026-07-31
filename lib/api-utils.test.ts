import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { paginationParams, withApiErrors } from "@/lib/api-utils";
import { ForbiddenError } from "@/lib/rbac";

describe("paginationParams", () => {
  it("defaults to limit 20, page 1", () => {
    expect(paginationParams(new URLSearchParams())).toEqual({ limit: 20, offset: 0, page: 1 });
  });

  it("clamps limit to [1, 100]", () => {
    expect(paginationParams(new URLSearchParams("limit=500")).limit).toBe(100);
    expect(paginationParams(new URLSearchParams("limit=-5")).limit).toBe(1);
  });

  it("treats limit=0 as absent (falsy) and falls back to the default", () => {
    expect(paginationParams(new URLSearchParams("limit=0")).limit).toBe(20);
  });

  it("computes offset from page and limit", () => {
    expect(paginationParams(new URLSearchParams("page=3&limit=10")).offset).toBe(20);
  });

  it("never returns a page below 1", () => {
    expect(paginationParams(new URLSearchParams("page=0")).page).toBe(1);
  });
});

function req() {
  return new NextRequest("https://example.com/api/test");
}

describe("withApiErrors", () => {
  it("passes through a successful response", async () => {
    const handler = withApiErrors(async () => Response.json({ ok: true }) as never);
    const res = await handler(req(), {});
    expect(res.status).toBe(200);
  });

  it("translates a ZodError to a 400", async () => {
    const schema = z.object({ name: z.string() });
    const handler = withApiErrors(async () => {
      schema.parse({});
      return Response.json({}) as never;
    });
    const res = await handler(req(), {});
    expect(res.status).toBe(400);
  });

  it("translates a ForbiddenError to a 403", async () => {
    const handler = withApiErrors(async () => {
      throw new ForbiddenError("CSR.Project.Write");
    });
    const res = await handler(req(), {});
    expect(res.status).toBe(403);
  });

  it("translates an unexpected error to a 500 without leaking its message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withApiErrors(async () => {
      throw new Error("db connection string: postgres://secret");
    });
    const res = await handler(req(), {});
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(JSON.stringify(body)).not.toContain("postgres://secret");
    spy.mockRestore();
  });
});
