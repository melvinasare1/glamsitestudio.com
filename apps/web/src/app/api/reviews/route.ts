import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import { createClient } from "@glamsite/shared/supabase/server";
import {
  ORDER_VERIFY_ERROR,
  orderIncludesProduct,
  parseProductIdQuery,
  parseReviewSubmitBody,
  publicReviewFromRow,
  reviewSummary,
} from "@/lib/reviews";

const UNIQUE_VIOLATION = "23505";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const productId = parseProductIdQuery(req.nextUrl.searchParams.get("productId"));
  if (!productId) {
    return NextResponse.json({ reviews: [], averageRating: 0, totalCount: 0 });
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("Reviews GET is missing Supabase", err);
    return jsonError("Reviews are not configured.", 500);
  }

  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, reviewer_name, rating, comment, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load product reviews", error);
    return jsonError("Could not load reviews. Please try again.", 500);
  }

  const reviews = (data ?? []).map(publicReviewFromRow);
  const summary = reviewSummary(reviews);
  return NextResponse.json({
    reviews,
    averageRating: summary.averageRating,
    totalCount: summary.totalCount,
  });
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = parseReviewSubmitBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const input = parsed.data;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error("Reviews POST is missing the Supabase service role", err);
    return jsonError("Reviews are not configured.", 500);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, seller_id")
    .eq("id", input.productId)
    .maybeSingle();

  if (productError) {
    console.error("Failed to look up product for review", productError);
    return jsonError("Could not verify this review. Please try again.", 500);
  }
  if (!product) {
    return jsonError(ORDER_VERIFY_ERROR, 400);
  }

  const sellerId = String(product.seller_id);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, seller_id, items, payment_reference")
    .eq("seller_id", sellerId)
    .ilike("payment_reference", input.orderReference)
    .maybeSingle();

  if (orderError) {
    console.error("Failed to look up order for review", orderError);
    return jsonError("Could not verify this review. Please try again.", 500);
  }
  if (!order || !orderIncludesProduct(order.items, input.productId)) {
    return jsonError(ORDER_VERIFY_ERROR, 400);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("product_reviews")
    .insert({
      product_id: input.productId,
      seller_id: sellerId,
      order_id: order.id,
      reviewer_name: input.reviewerName,
      rating: input.rating,
      comment: input.comment,
    })
    .select("id, reviewer_name, rating, comment, created_at")
    .single();

  if (insertError?.code === UNIQUE_VIOLATION) {
    return jsonError("You've already left a review for this product with that order.", 409);
  }
  if (insertError || !inserted) {
    console.error("Failed to insert product review", insertError);
    return jsonError("Could not save your review. Please try again.", 500);
  }

  return NextResponse.json({ review: publicReviewFromRow(inserted) }, { status: 201 });
}
