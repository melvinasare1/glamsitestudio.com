import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";

const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

/** Marketing-site enquiries from salon owners → leads (server only). */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }, { status: 201 });

  const lead = {
    name: clip(body.name, 120),
    business_name: clip(body.businessName, 120),
    email: clip(body.email, 254).toLowerCase(),
    phone: clip(body.phone, 40),
    message: clip(body.message, 2000),
    source: clip(body.source, 60),
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
  return NextResponse.json({ ok: true }, { status: 201 });
}
