# Glam Site Studios: follow-ups

Work deferred on purpose, with the trigger for building it. Only build an item
when its trigger is hit, or when we decide to. Keep resolved items, marked done.

## Deferred after stage 2

- **Draft preview.** Owners can't see their site until it's published,
  because public pages read as an anonymous visitor. Trigger: first
  customer feedback, or before the templates are designed (whichever first).
- **Publishing isn't tied to payment.** Any owner can publish. Trigger:
  stage 3, gate on an active Stripe subscription.
- **Sign-up is free and self-serve.** Temporary until Stripe Checkout creates
  businesses from a webhook. Trigger: stage 3.
- **Opening hours save as delete-then-insert**, not one transaction. A failure
  between the two leaves no hours. Trigger: if it ever happens, move to a
  database function.
- **Custom-domain lookups in middleware hit the database on every request.**
  Trigger: first custom domain goes live; add caching.
- **Auth emails.** Supabase's built-in email only reaches project team
  members, so sign-up confirmations need Resend SMTP set up in both projects.
  Trigger: before the first real sign-up.
- **Old Ansaa buckets** (`product-images`, `id-verification`) are empty and
  can be deleted in Supabase Storage. No trigger.

## Deferred after booking phase 1

- **Any owner can turn on Glam Site booking.** It should come with the
  booking add-on. Trigger: stage 3 billing.
- **No rate limit on the public booking API.** A honeypot stops simple bots,
  but nothing stops someone filling a diary with fake bookings. Trigger: the
  first abuse, or before 10 live sites take bookings.
- **Losing a booking race leaves a client record** with no appointment (the
  client is saved before the time is claimed). Harmless; tidy up when a
  client list page is built.
- **The booking page uses neutral colours** when an owner hasn't picked
  brand colours, not each template's own palette. Trigger: the second
  template design.
- **Two versions of the icon library** (`lucide-react` 1.x in the dashboard,
  0.408 in the site app). The dashboard header's menu icon renders
  differently on the server and in the browser, so React reports a hydration
  error and re-renders the page in the browser. It was already on `main`.
  Trigger: next dashboard UI work; align both apps on one version.

## Resolved

- **Server pages showed cached database reads.** Next.js cached the GET
  requests made by the Supabase clients, so a page could show an appointment
  as booked after it was cancelled. Both server clients now always read live
  data (fixed with booking phase 1).

- **RLS performance warnings and the unindexed foreign key** from the Ansaa
  schema: gone with the stage 2 baseline (policies use `(select auth.uid())`;
  composite foreign keys indexed in `20261014100000_fk_indexes.sql`).

---

## How to add a gap

When something is deferred on purpose, append it here rather than leaving it
in a chat. Include:

1. **What** is missing (one sentence).
2. **Why** it is deferred (tiny scale, waiting on a decision, blocked on X).
3. **Trigger** to build it, if there is one. If there isn't, say so.

Keep resolved items in place and mark them done, so we don't rediscover them.
