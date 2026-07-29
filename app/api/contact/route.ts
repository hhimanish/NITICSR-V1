import { NextRequest, NextResponse } from "next/server";

import { saveLead } from "@/lib/db";
import { sendContactConfirmation, sendInternalNotification } from "@/lib/email";
import { ContactFormSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = ContactFormSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    await saveLead(parsed.data);
  } catch (error) {
    console.error("Failed to save contact lead", error);
    return NextResponse.json(
      { error: "We couldn't save your message. Please try again shortly." },
      { status: 500 }
    );
  }

  try {
    await sendContactConfirmation(parsed.data);
    await sendInternalNotification(parsed.data);
  } catch (error) {
    console.error("Failed to send contact emails", error);
  }

  return NextResponse.json({ ok: true });
}
