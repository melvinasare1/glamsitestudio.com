# Glam Site Studios — known follow-ups & pre-scale checklist

Running notes on work that is **intentionally deferred**, with a rough trigger
for when it needs to get built. Add new gaps at the bottom of the relevant
section as they come up. Do not treat this file as a backlog to clear — only
build an item when its trigger is hit, or when we explicitly decide to.

---

## Before onboarding customer #4 (custom domains)

**Problem:** Sellers currently get a placeholder domain (`{slug}.local`) and a
template preview URL (`/store/{template}`). Real custom domains
(`makeup.com`) need manual setup per seller right now — fine for the first 2–3
manually onboarded sellers, not fine past that.

**How it works (for whenever this gets built):**

1. Seller buys their own domain elsewhere (Namecheap, GoDaddy, etc).
2. They point DNS at Vercel — CNAME to `cname.vercel-dns.com` for a subdomain,
   or an A record to Vercel's IP for a root domain.
3. Domain gets added to the `apps/web` Vercel project (dashboard or API) —
   Vercel auto-provisions SSL once DNS resolves correctly.
4. `middleware.ts` in `apps/web` reads the incoming `Host` header, looks up
   which seller owns that domain (query `sellers.domain`, which already exists
   in the schema, currently holding a placeholder), and rewrites the request
   internally to that seller's storefront route — buyer never sees the internal
   path.

**Business model decision (agreed):**

- Self-serve by default — sellers who are comfortable with DNS do steps 1–2
  themselves, guided by our docs/support.
- Paid add-on for everyone else — we buy the domain and handle DNS / Vercel
  setup for a fee, for sellers who don't want to deal with it themselves.

**Trigger to build this:** before scaling past ~3 customers. Manual per-seller
Vercel dashboard setup is fine at tiny scale, becomes a bottleneck past that.

**Not yet decided:**

- Exact fee for the paid add-on.
- Whether domain verification status needs a UI in the dashboard (e.g. "DNS
  pending" / "live") or whether manual confirmation is fine until self-serve
  volume justifies it.

---

## Other known gaps (lower priority, no hard trigger yet)

- **`updated_at` on products** — currently falls back to `created_at` since no
  trigger exists. Migration snippet already written, just needs to be applied.
- **Product image upload** — works via Supabase Storage on the dashboard's
  product flow; confirm this is consistent across the multi-tab creation flow
  and the quick-edit modal.
- **Analytics** — Vercel Analytics custom events are built but gated behind
  Vercel Pro (not yet subscribed). Page views already work on the free tier.
  Revisit once Pro is active.
- **Admin notification on new seller signup** — no email/alert yet when someone
  completes onboarding and is awaiting review. Currently requires manually
  checking the admin review panel.
- **Seller notification on approval/rejection** — no automated email yet
  (Resend is already wired for other purposes). Sellers currently need to be
  told manually that they've been approved.
- **Business registration → extra features** — the `has_business_registration`
  flag is captured at onboarding but nothing currently reads it. No
  feature-gating logic built yet.
- **Self-serve "I've paid"** — `/dashboard/billing` shows Glam Site Studios's MoMo number
  and a permanent 6-digit `billing_reference`, then we mark the account active
  by hand. A seller button that claims payment was sent is deferred until
  volume makes matching by hand a bottleneck.
- **Lock dashboard after trial expiry** — the trial banner and expiry modal
  stay visible when `subscription_status = overdue`, but sellers can still use
  the dashboard. Access restriction is a separate product decision, not
  implemented.
- **Dedicated subscription status** — done. `sellers.subscription_status`
  (`trialing` | `active` | `overdue`) is separate from storefront `status`.
  Admins confirm MoMo payments on `/dashboard/admin/billing`, which writes
  `billing_payments` and sets `subscription_status = active`.

---

## How to add a gap

When something is deferred on purpose, append it here rather than leaving it
in a chat. Include:

1. **What** is missing (one sentence).
2. **Why** it is deferred (tiny scale, waiting on a decision, blocked on X).
3. **Trigger** to build it, if there is one. If there isn't, say so.

Keep resolved items in place and mark them done, so we don't rediscover them.

---

## Glam Site Studios: database performance (stage 2)

- **What:** the Supabase performance advisor flags 26 RLS policies that call
  `auth.uid()` per row instead of `(select auth.uid())`, one unindexed foreign
  key (`storefront_events.product_id`), and multiple permissive select
  policies on `store_blog_posts`.
- **Why deferred:** almost all of these tables (products, orders, customers,
  blog, filters) are removed in stage 2, and the clean baseline migration will
  write the remaining policies the fast way.
- **Trigger:** the stage 2 baseline migration.
