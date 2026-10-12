import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { parseContactSubmitBody } from "@/lib/contact";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = parseContactSubmitBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("Contact POST is missing the Supabase service role", err);
    return jsonError("Contact is not configured on this store.", 500);
  }

  const { data: sellerRow, error: sellerError } = await supabase
    .from("sellers")
    .select("id, store_slug")
    .eq("store_slug", parsed.data.storeSlug)
    .maybeSingle();

  if (sellerError) {
    console.error("Failed to look up seller for contact", sellerError);
    return jsonError("Could not look up this store. Please try again.", 500);
  }
  if (!sellerRow) {
    return jsonError("This store could not be found.", 404);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("contact_enquiries")
    .insert({
      seller_id: sellerRow.id,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert contact enquiry", insertError);
    return jsonError("Could not send your message. Please try again.", 500);
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
