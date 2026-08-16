import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { softDeleteUserByClerkId, upsertUserFromClerk } from "@/lib/users-repo";

type ClerkEmailAddress = { id: string; email_address: string };

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: ClerkEmailAddress[];
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
};

function primaryEmail(data: ClerkUserEvent["data"]) {
  const addresses = data.email_addresses ?? [];
  const primary = addresses.find((a) => a.id === data.primary_email_address_id);
  return primary?.email_address ?? addresses[0]?.email_address ?? null;
}

export async function POST(req: NextRequest) {
  console.log("[clerk-webhook] received request");

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[clerk-webhook] missing svix headers");
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: ClerkUserEvent;
  try {
    const webhook = new Webhook(secret);
    event = webhook.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch (error) {
    console.error("[clerk-webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  console.log("[clerk-webhook] verified event", event.type);

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const email = primaryEmail(event.data);
        if (!email) break;

        const fullName = [event.data.first_name, event.data.last_name].filter(Boolean).join(" ") || null;

        await upsertUserFromClerk({
          clerkUserId: event.data.id,
          email,
          fullName,
          avatarUrl: event.data.image_url ?? null,
        });
        break;
      }
      case "user.deleted": {
        await softDeleteUserByClerkId(event.data.id);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Failed to process Clerk webhook", error);
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
