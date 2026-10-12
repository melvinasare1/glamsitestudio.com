import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { parseTrackBody } from "@/lib/track";

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

  const parsed = parseTrackBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const { storeSlug, path, sessionId, productId } = parsed.data;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("Tracking is missing the Supabase service role", err);
    return jsonError("Tracking is not configured.", 500);
  }

  const { data: sellerRow, error: sellerError } = await supabase
    .from("sellers")
    .select("id")
    .eq("store_slug", storeSlug)
    .maybeSingle();

  if (sellerError) {
    console.error("Failed to look up seller for tracking", sellerError);
    return jsonError("Could not record this visit.", 500);
  }
  if (!sellerRow) {
    return jsonError("This store could not be found.", 404);
  }

  const sellerId = String(sellerRow.id);
  let resolvedProductId: string | null = null;

  if (productId) {
    const { data: productRow, error: productError } = await supabase
      .from("products")
      .select("id, seller_id")
      .eq("id", productId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (productError) {
      console.error("Failed to look up product for tracking", productError);
    } else if (productRow) {
      resolvedProductId = String(productRow.id);
    }
  }

  const rows: Array<{
    seller_id: string;
    event_type: "page_view" | "product_view";
    path: string;
    product_id: string | null;
    session_id: string;
  }> = [
    {
      seller_id: sellerId,
      event_type: "page_view",
      path,
      product_id: resolvedProductId,
      session_id: sessionId,
    },
  ];

  if (resolvedProductId) {
    rows.push({
      seller_id: sellerId,
      event_type: "product_view",
      path,
      product_id: resolvedProductId,
      session_id: sessionId,
    });
  }

  const { error: insertError } = await supabase.from("storefront_events").insert(rows);
  if (insertError) {
    console.error("Failed to insert storefront events", insertError);
    return jsonError("Could not record this visit.", 500);
  }

  return new NextResponse(null, { status: 204 });
}
