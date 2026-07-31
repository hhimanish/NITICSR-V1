import { NextRequest } from "next/server";
import { buildMatchMessages, CEREBRAS_MODEL, findDemoNgo, getCerebrasClient } from "@/lib/cerebras";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { MatchRequestSchema, ModelMatchSchema, type MatchResult } from "@/lib/schemas";
import { createIncrementalObjectParser } from "@/lib/streaming";

export const runtime = "nodejs";

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// This is the public, unauthenticated homepage demo — it calls a paid AI
// API on every request, so it needs abuse protection more than most routes.
const MATCH_RATE_LIMIT = 10;
const MATCH_RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(`match:${clientIp(req)}`, MATCH_RATE_LIMIT, MATCH_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests — please try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 60000) / 1000)) },
    });
  }

  const json = await req.json().catch(() => null);
  const parsed = MatchRequestSchema.safeParse(json);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", issues: parsed.error.issues }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let cerebras;
  try {
    cerebras = getCerebrasClient();
  } catch {
    return new Response(
      JSON.stringify({ error: "AI matchmaking is not configured (missing CEREBRAS_API_KEY)." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const messages = buildMatchMessages(parsed.data);
  const seenIds = new Set<string>();

  const parser = createIncrementalObjectParser<MatchResult>((raw) => {
    const result = ModelMatchSchema.safeParse(raw);
    if (!result.success) return null;
    if (seenIds.has(result.data.ngoId)) return null;

    const ngo = findDemoNgo(result.data.ngoId);
    if (!ngo) return null;

    seenIds.add(result.data.ngoId);
    return {
      ...result.data,
      name: ngo.name,
      description: ngo.description,
    };
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const completion = await cerebras.chat.completions.create({
          model: CEREBRAS_MODEL,
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 900,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;

          for (const match of parser.feed(delta)) {
            controller.enqueue(encoder.encode(sse("match", match)));
          }
        }

        controller.enqueue(encoder.encode(sse("done", { count: seenIds.size })));
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sse("error", { message: error instanceof Error ? error.message : "Matchmaking failed" })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
