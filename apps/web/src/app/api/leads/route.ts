import { NextRequest, NextResponse } from "next/server";
import { isValidCallSlot } from "@glamsite/shared/call-slots";
import { doneForYouCallEmail, sendEmail } from "@glamsite/shared/email";
import { requestIp, tooManyRequests, withinRateLimit } from "@glamsite/shared/rate-limit";
import { createAdminClient } from "@glamsite/shared/supabase/admin";

const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

/** Marketing-site enquiries from salon owners → leads (server only). */
export async function POST(req: NextRequest) {
  const ip = requestIp(req.headers);
  if (!(await withinRateLimit(`leads:${ip}`, 60, 5))) {
    return tooManyRequests();
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }, { status: 201 });

  const callAtRaw = clip(body.callAt, 40);
  if (!callAtRaw || !isValidCallSlot(callAtRaw)) {
    return NextResponse.json({ error: "Pick a time for us to call." }, { status: 400 });
  }

  const lead = {
    name: clip(body.name, 120),
    business_name: clip(body.businessName, 120),
    email: clip(body.email, 254).toLowerCase(),
    phone: clip(body.phone, 40),
    message: clip(body.message, 2000),
    source: clip(body.source, 60),
    call_at: callAtRaw,
  };
  if (!lead.email && !lead.phone) {
    return NextResponse.json({ error: "Add an email or phone number." }, { status: 400 });
  }

  try {
    const { error } = await createAdminClient().from("leads").insert(lead);
    if (error) throw error;
  } catch (err) {
    console.error("[leads] insert failed", err);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }

  const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;
  if (inboxEmail) {
    const when = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(lead.call_at));
    const rendered = doneForYouCallEmail({
      name: lead.name,
      businessName: lead.business_name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      when,
    });
    await sendEmail({ to: inboxEmail, replyTo: lead.email || undefined, ...rendered });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
