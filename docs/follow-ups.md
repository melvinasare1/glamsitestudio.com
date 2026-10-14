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

## Resolved

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
