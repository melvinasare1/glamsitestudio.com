import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { parseEnquiry } from "@/lib/contact";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Contact form on a live site → enquiries (shown in that owner's dashboard). */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = parseEnquiry(raw);
  if (!parsed.ok) {
    // Pretend bots succeeded so they don't retry.
    return parsed.bot ? NextResponse.json({ ok: true }, { status: 201 }) : jsonError(parsed.error, 400);
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("[contact] service role missing", err);
    return jsonError("Messages aren't set up on this site yet.", 500);
  }

  const { data: business, error: lookupError } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", parsed.data.slug)
    .eq("status", "live")
    .maybeSingle();

  if (lookupError) {
    console.error("[contact] business lookup failed", lookupError);
    return jsonError("Something went wrong. Please try again.", 500);
  }
  if (!business) return jsonError("This site isn't accepting messages.", 404);

  const { error } = await supabase.from("enquiries").insert({
    business_id: business.id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[contact] insert failed", error);
    return jsonError("Could not send your message. Please try again.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
