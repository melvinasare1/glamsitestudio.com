"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, Search, Star } from "lucide-react";
import type { PdpChrome } from "@/components/store/pdp/chrome";
import type { PublicReview } from "@/lib/reviews";

type ReviewsPayload = {
  reviews: PublicReview[];
  averageRating: number;
  totalCount: number;
};

type SortMode = "relevant" | "newest" | "oldest";

const PAGE_SIZE = 6;

function emptyPayload(): ReviewsPayload {
  return { reviews: [], averageRating: 0, totalCount: 0 };
}

function relativeTime(createdAt: number): string {
  if (!createdAt) return "";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (createdAt >= startOfToday.getTime()) return "Today";
  if (createdAt >= startOfYesterday.getTime()) return "Yesterday";

  const diffMs = createdAt - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const day = 24 * 60 * 60 * 1000;
  if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  return rtf.format(Math.round(diffMs / (30 * day)), "month");
}

function displayReviewerName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

function StarRow({
  value,
  accent,
  size = "h-4 w-4",
}: {
  value: number;
  accent: string;
  size?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <Star
            key={star}
            className={size}
            strokeWidth={1.5}
            color={filled ? accent : "rgba(0,0,0,0.18)"}
            fill={filled ? accent : "none"}
          />
        );
      })}
    </span>
  );
}

function ratingCounts(reviews: PublicReview[]): Record<number, number> {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[rating] += 1;
  }
  return counts;
}

export function PdpReviews({ productId, chrome }: { productId: string; chrome: PdpChrome }) {
  const [payload, setPayload] = useState<ReviewsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("relevant");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [page, setPage] = useState(1);

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !body || typeof body !== "object") {
        setPayload(emptyPayload());
        return;
      }
      const data = body as Partial<ReviewsPayload>;
      setPayload({
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        averageRating: Number(data.averageRating ?? 0),
        totalCount: Number(data.totalCount ?? 0),
      });
    } catch {
      setPayload(emptyPayload());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the product changes
  }, [productId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderReference,
          reviewerName,
          rating,
          comment,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error?: unknown }).error ?? "")
          : "";

      if (!response.ok) {
        setError(message || "We couldn't save that review. Check the order number and try again.");
        return;
      }

      setSuccess("Thanks — your review is in.");
      setComment("");
      setOrderReference("");
      setFormOpen(false);
      await loadReviews();
    } catch {
      setError("Could not reach reviews. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const counts = useMemo(() => ratingCounts(payload.reviews), [payload.reviews]);
  const maxCount = Math.max(1, ...Object.values(counts));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = payload.reviews.filter((review) => {
      if (ratingFilter && review.rating !== ratingFilter) return false;
      if (!needle) return true;
      return (
        review.comment.toLowerCase().includes(needle) ||
        review.reviewerName.toLowerCase().includes(needle)
      );
    });
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "oldest") {
      sorted.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      sorted.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
    }
    return sorted;
  }, [payload.reviews, query, ratingFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, ratingFilter, productId]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className={chrome.sectionClass}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(220px,0.78fr)_minmax(0,1.42fr)] lg:gap-16">
        <div>
          <h2 className={chrome.titleClass}>Customer Reviews</h2>
          {loading ? (
            <p className={`mt-5 ${chrome.mutedClass}`}>Loading reviews…</p>
          ) : (
            <>
              <p className={`mt-6 text-[40px] font-semibold leading-none tracking-tight`} style={{ color: chrome.ink }}>
                {payload.totalCount > 0 ? payload.averageRating.toFixed(1) : "0.0"}
                <span className={`ml-1 text-[22px] font-medium ${chrome.mutedClass}`}>/ 5</span>
              </p>
              <div className="mt-3">
                <StarRow value={payload.averageRating} accent={chrome.accent} size="h-5 w-5" />
              </div>
              <p className={`mt-2 ${chrome.mutedClass}`}>
                {payload.totalCount === 1
                  ? "Based on 1 review."
                  : `Based on ${payload.totalCount} reviews.`}
              </p>
              <ul className="mt-8 space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = counts[star] ?? 0;
                  const width = payload.totalCount === 0 ? 0 : (count / maxCount) * 100;
                  return (
                    <li key={star} className="flex items-center gap-3 text-sm">
                      <span className={`w-8 shrink-0 tabular-nums ${chrome.strongClass}`}>{star} ★</span>
                      <div className={`min-w-0 flex-1 ${chrome.barTrackClass}`}>
                        <div className={chrome.barFillClass} style={{ width: `${width}%` }} />
                      </div>
                      <span className={`w-8 shrink-0 text-right tabular-nums ${chrome.mutedClass}`}>{count}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setFormOpen((open) => !open);
              setError(null);
              setSuccess(null);
            }}
            className={`mt-8 ${chrome.addButtonClass}`}
          >
            {formOpen ? "Cancel" : "Write a review"}
          </button>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className={`relative min-w-0 flex-1 ${chrome.filterClass} flex items-center gap-2`}>
              <Search className="h-4 w-4 shrink-0 opacity-45" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Search reviews</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-45"
              />
            </label>
            <label className="sr-only" htmlFor="review-sort">
              Sort reviews
            </label>
            <select
              id="review-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className={chrome.filterClass}
            >
              <option value="relevant">Most relevant</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <label className="sr-only" htmlFor="review-rating">
              Filter by rating
            </label>
            <select
              id="review-rating"
              value={ratingFilter}
              onChange={(event) => setRatingFilter(Number(event.target.value))}
              className={chrome.filterClass}
            >
              <option value={0}>All ratings</option>
              <option value={5}>5 stars</option>
              <option value={4}>4 stars</option>
              <option value={3}>3 stars</option>
              <option value={2}>2 stars</option>
              <option value={1}>1 star</option>
            </select>
          </div>

          {success ? (
            <p role="status" className={chrome.successClass}>
              {success}
            </p>
          ) : null}

          {formOpen ? (
            <form onSubmit={handleSubmit} className={chrome.formClass}>
              <p className={chrome.mutedClass}>
                We'll verify this against a real order. Use the ANS- reference from checkout.
              </p>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-semibold">
                  Your name
                  <input
                    required
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    className={chrome.fieldClass}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-semibold">Rating</legend>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const selected = star <= rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} star${star === 1 ? "" : "s"}`}
                          aria-pressed={star === rating}
                          onClick={() => setRating(star)}
                          className="p-0.5"
                        >
                          <Star
                            className="h-6 w-6"
                            strokeWidth={1.75}
                            color={selected ? chrome.accent : "rgba(0,0,0,0.2)"}
                            fill={selected ? chrome.accent : "none"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <label className="block text-sm font-semibold">
                  Comment
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className={chrome.textareaClass}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Order reference
                  <input
                    required
                    value={orderReference}
                    onChange={(event) => setOrderReference(event.target.value)}
                    placeholder="ANS-XXXXXXXX"
                    className={chrome.fieldClass}
                  />
                </label>
              </div>
              {error ? (
                <p role="alert" className={chrome.errorClass}>
                  {error}
                </p>
              ) : null}
              <button type="submit" disabled={submitting} className={chrome.submitClass}>
                {submitting ? "Sending…" : "Submit review"}
              </button>
            </form>
          ) : null}

          {!loading && visible.length === 0 ? (
            <p className={`mt-10 ${chrome.mutedClass}`}>
              {payload.totalCount === 0
                ? "No reviews yet for this product."
                : "No reviews match that search."}
            </p>
          ) : null}

          {paged.length > 0 ? (
            <>
              <ul className="mt-4">
                {paged.map((review) => (
                  <li key={review.id} className={`border-t py-8 first:border-t-0 ${chrome.dividerClass}`}>
                    <div className="flex items-start justify-between gap-4">
                      <StarRow value={review.rating} accent={chrome.accent} />
                      <span className={`shrink-0 text-sm ${chrome.mutedClass}`}>
                        {relativeTime(review.createdAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <p className={chrome.strongClass}>{displayReviewerName(review.reviewerName)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${chrome.verifiedClass}`}>
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Verified buyer
                      </span>
                    </div>
                    <p className={`mt-3 ${chrome.bodyClass}`}>{review.comment}</p>
                  </li>
                ))}
              </ul>
              {pageCount > 1 ? (
                <nav className="mt-8 flex flex-wrap items-center gap-2" aria-label="Review pages">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    className={`${chrome.addButtonClass} disabled:opacity-40`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => {
                    const number = index + 1;
                    const active = number === currentPage;
                    return (
                      <button
                        key={number}
                        type="button"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setPage(number)}
                        className={
                          active
                            ? `${chrome.addButtonClass} ${chrome.strongClass}`
                            : chrome.addButtonClass
                        }
                      >
                        {number}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    className={`${chrome.addButtonClass} disabled:opacity-40`}
                  >
                    Next
                  </button>
                </nav>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
