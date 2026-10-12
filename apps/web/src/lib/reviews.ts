import { productReviewFromRow } from "@glamsite/shared/mappers";
import type { ProductReview } from "@glamsite/shared/types";

const PRODUCT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ORDER_VERIFY_ERROR = "We couldn't verify that order number for this product";

export type ReviewSubmitInput = {
  productId: string;
  orderReference: string;
  reviewerName: string;
  rating: number;
  comment: string;
};

export type PublicReview = {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function trim(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export function parseReviewSubmitBody(
  raw: unknown
): { ok: true; data: ReviewSubmitInput } | { ok: false; error: string } {
  const body = asRecord(raw);
  const productId = trim(body.productId, 36);
  const orderReference = trim(body.orderReference, 40).toUpperCase();
  const reviewerName = trim(body.reviewerName, 120);
  const comment = trim(body.comment, 2000);
  const rating = Number(body.rating);

  if (!PRODUCT_UUID_RE.test(productId)) {
    return { ok: false, error: "Missing product." };
  }
  if (!orderReference) {
    return { ok: false, error: "Please enter your order number." };
  }
  if (!reviewerName) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be a whole number from 1 to 5." };
  }
  if (!comment) {
    return { ok: false, error: "Please write a short review." };
  }

  return {
    ok: true,
    data: { productId, orderReference, reviewerName, rating, comment },
  };
}

export function parseProductIdQuery(value: string | null): string | null {
  const id = (value ?? "").trim();
  return PRODUCT_UUID_RE.test(id) ? id : null;
}

export function orderIncludesProduct(
  items: unknown,
  productId: string
): boolean {
  if (!Array.isArray(items)) return false;
  const target = productId.toLowerCase();
  return items.some((entry) => {
    const fields = asRecord(entry);
    const id = String(fields.productId ?? fields.product_id ?? "").trim().toLowerCase();
    return id === target;
  });
}

export function publicReviewFromRow(row: unknown): PublicReview {
  const review: ProductReview = productReviewFromRow(row);
  return {
    id: review.id,
    reviewerName: review.reviewerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

export function reviewSummary(reviews: PublicReview[]): {
  averageRating: number;
  totalCount: number;
} {
  const totalCount = reviews.length;
  if (totalCount === 0) return { averageRating: 0, totalCount: 0 };
  const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
  return {
    averageRating: Math.round((sum / totalCount) * 10) / 10,
    totalCount,
  };
}
