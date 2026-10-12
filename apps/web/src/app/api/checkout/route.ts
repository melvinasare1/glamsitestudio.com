import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import {
  momoDetails,
  orderItemsFromCatalog,
  parseCheckoutBody,
  paymentReference,
} from "@/lib/checkout";

const UNIQUE_VIOLATION = "23505";

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

  const parsed = parseCheckoutBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const checkout = parsed.data;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("Checkout is missing the Supabase service role", err);
    return jsonError("Checkout is not configured on this store.", 500);
  }

  const { data: sellerRow, error: sellerError } = await supabase
    .from("sellers")
    .select("id, business_name, phone, momo_phone, store_slug, status")
    .eq("store_slug", checkout.storeSlug)
    .maybeSingle();

  if (sellerError) {
    console.error("Failed to look up seller for checkout", sellerError);
    return jsonError("Could not look up this store. Please try again.", 500);
  }
  if (!sellerRow) {
    return jsonError("This store could not be found.", 404);
  }
  if (sellerRow.status === "offboarded") {
    return jsonError("This store is no longer accepting orders.", 400);
  }

  const sellerId = String(sellerRow.id);
  const productIds = [...new Set(checkout.items.map((item) => item.productId))];

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, name, price_cedis, active, seller_id")
    .in("id", productIds)
    .eq("seller_id", sellerId);

  if (productError) {
    console.error("Failed to load products for checkout", productError);
    return jsonError("Could not verify your bag. Please try again.", 500);
  }

  const catalog = new Map<string, { name: string; priceCedis: number }>();
  for (const row of productRows ?? []) {
    if (!row.active) continue;
    catalog.set(String(row.id), {
      name: String(row.name ?? ""),
      priceCedis: Number(row.price_cedis ?? 0),
    });
  }

  const priced = orderItemsFromCatalog(checkout.items, catalog);
  if (!priced.ok) return jsonError(priced.error, 400);

  const customerId = await upsertCustomer(supabase, {
    sellerId,
    email: checkout.buyerEmail,
    name: checkout.buyerName,
    phone: checkout.buyerPhone,
    deliveryAddress: checkout.deliveryAddress,
  });
  if ("error" in customerId) {
    return jsonError(customerId.error, 500);
  }

  const reference = paymentReference();
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      id: randomUUID(),
      seller_id: sellerId,
      customer_id: customerId.id,
      items: priced.items,
      subtotal_cedis: priced.subtotalCedis,
      buyer_name: checkout.buyerName,
      buyer_email: checkout.buyerEmail,
      buyer_phone: checkout.buyerPhone,
      delivery_address: checkout.deliveryAddress,
      status: "pending_payment",
      payment_reference: reference,
    })
    .select("id")
    .single();

  if (orderError || !orderRow) {
    console.error("Failed to insert checkout order", orderError);
    return jsonError("Could not create your order. Please try again.", 500);
  }

  const momo = momoDetails({
    businessName: String(sellerRow.business_name ?? ""),
    phone: String(sellerRow.momo_phone || sellerRow.phone || ""),
    paymentReference: reference,
    subtotalCedis: priced.subtotalCedis,
  });

  return NextResponse.json(
    {
      orderId: orderRow.id,
      paymentReference: reference,
      subtotalCedis: priced.subtotalCedis,
      momo,
    },
    { status: 201 }
  );
}

async function upsertCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    sellerId: string;
    email: string;
    name: string;
    phone: string;
    deliveryAddress: string;
  }
): Promise<{ id: string } | { error: string }> {
  const profile = {
    name: input.name,
    phone: input.phone,
    delivery_address: input.deliveryAddress,
  };

  const { data: existing, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("seller_id", input.sellerId)
    .eq("email", input.email)
    .maybeSingle();

  if (lookupError) {
    console.error("Failed to look up customer", lookupError);
    return { error: "Could not look up your customer profile. Please try again." };
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from("customers")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to update customer", error);
      return { error: "Could not update your customer details. Please try again." };
    }
    return { id: String(data.id) };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      seller_id: input.sellerId,
      email: input.email,
      ...profile,
    })
    .select("id")
    .single();

  if (error?.code === UNIQUE_VIOLATION) {
    const { data: raced, error: racedError } = await supabase
      .from("customers")
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq("seller_id", input.sellerId)
      .eq("email", input.email)
      .select("id")
      .single();

    if (racedError || !raced) {
      console.error("Failed to update customer after unique conflict", racedError);
      return { error: "Could not save your customer details. Please try again." };
    }
    return { id: String(raced.id) };
  }

  if (error || !data) {
    console.error("Failed to create customer", error);
    return { error: "Could not save your customer details. Please try again." };
  }

  return { id: String(data.id) };
}
