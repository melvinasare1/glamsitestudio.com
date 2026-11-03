# Glam Site Studios: follow-ups

Work deferred on purpose, with the trigger for building it. Only build an item
when its trigger is hit, or when we decide to. Keep resolved items, marked done.

## Deferred after stage 2

- **Draft preview.** Owners can't see their site until it's published,
  because public pages read as an anonymous visitor. Trigger: first
  customer feedback, or before the templates are designed (whichever first).
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

## Deferred after the email-only sign-up redesign

- **No way to upgrade hosting tier or add done-for-you design after
  launch.** Sign-up no longer asks for a plan, and launch is hard-coded to
  Basic ($1 for the first 3 months). The Stripe Customer Portal's plan-switcher needs
  pre-configured Products/Prices, which this app doesn't use (Checkout
  builds prices inline with `price_data`) — so "Manage billing" won't
  actually offer an upgrade yet. Trigger: first owner asks to upgrade, or
  before stage 3's "10 paying sites" gate.
- **New owners get an auto-generated name and web address**
  (`"{email local-part}'s site"`, `{local-part}` or `{local-part}-xxxxxx`
  subdomain), since sign-up no longer asks for either. Name is editable on
  Business details; the subdomain isn't editable anywhere yet. Trigger:
  stage 4 self-serve domains, or sooner if it causes support requests.
- **Supabase's built-in auth emails (password reset on `/login`) still
  aren't routed through Resend**, so they only reach project team members,
  not real owners. Signup's own sign-in email now goes through Resend (see
  Resolved), but `resetPasswordForEmail` on `/login` still relies on
  Supabase's unconfigured sender. Trigger: before password reset is needed
  by a real owner, or set up Resend SMTP in the Supabase dashboard.

## Deferred after booking phase 1

- **Any owner can turn on Glam Site booking.** It should come with the
  booking add-on. Trigger: stage 3 billing.
- **No rate limit on the public booking API.** A honeypot stops simple bots,
  but nothing stops someone filling a diary with fake bookings. Trigger: the
  first abuse, or before 10 live sites take bookings.
- **Losing a booking race leaves a client record** with no appointment (the
  client is saved before the time is claimed). Now visible as a "0 visits"
  row on the Customers page. Harmless; hide or clean up these rows if they
  turn out to be common enough to be noisy.
- **The booking page uses neutral colours** when an owner hasn't picked
  brand colours, not each template's own palette. Trigger: the second
  template design.
- **No visual template picker or per-template detail page** (like
  https://themes.shopify.com/themes/horizon/presets/horizon — preview
  image, what it offers, a demo link, price). With only Luxe shipped,
  there's nothing to compare yet. Trigger: the second template design.
- **Two versions of the icon library** (`lucide-react` 1.x in the dashboard,
  0.408 in the site app). The dashboard header's menu icon renders
  differently on the server and in the browser, so React reports a hydration
  error and re-renders the page in the browser. It was already on `main`.
  Trigger: next dashboard UI work; align both apps on one version.

- **True multi-page templates.** Every template today (Luxe, Salon, Barber)
  renders as one scrolling page at `/sites/[slug]`; `sections` only picks
  which blocks appear on that page, not separate URLs. The "Search &
  sharing" section's meta title/description already covers this one page.
  If a template ever splits into real routes (e.g. `/about`, `/services`),
  each page will need its own meta title/description, which `site-content.ts`
  doesn't support yet (one `seo` section per business, not per page).
  Trigger: first template that needs separate URLs per section.
- **Owner dashboard on the owner's own domain** (e.g. `dashboard.bellahair.co.uk`).
  Clients never see the dashboard, and sign-in emails would still have to go
  through `dashboard.glamsitestudio.com`, so it adds setup and support for
  little gain. Trigger: an agency or chain asks to resell under its own brand.
- **Live chat uses Tidio** (`apps/dashboard/src/app/layout.tsx`), picked for
  zero setup cost while there are only a handful of owners. Trigger: Tidio's
  per-conversation pricing starts to bite — look at a cheaper provider
  (Crisp, Chatwoot self-hosted) once there's real support volume.

## Resolved

- **Publishing wasn't tied to payment; sign-up was free and self-serve.**
  Both fixed together: sign-up creates a draft business for free (now on
  purpose, not as a placeholder), and launching it — making it public — is
  the one action gated on the $1 first-month Checkout (`startLaunchCheckout`,
  `setPublished`).

- **Server pages showed cached database reads.** Next.js cached the GET
  requests made by the Supabase clients, so a page could show an appointment
  as booked after it was cancelled. Both server clients now always read live
  data (fixed with booking phase 1).

- **RLS performance warnings and the unindexed foreign key** from the Ansaa
  schema: gone with the stage 2 baseline (policies use `(select auth.uid())`;
  composite foreign keys indexed in `20261014100000_fk_indexes.sql`).

- **Account takeover via sign-up's magic link.** `startSignup` used to
  redeem the admin-generated magic link server-side in the same request,
  for any email — including one that already had an account. Anyone who
  knew a salon owner's email, without access to their inbox, could get
  signed into that owner's dashboard: client PII, booking settings, Stripe
  billing and Connect payout config. Fixed: GoTrue's `verification_type`
  tells us whether the email is brand-new (`"signup"`, safe to redeem
  immediately since nobody can be impersonated) or already has an account
  (`"magiclink"`); for the latter we now only email the sign-in link, via
  Resend, and require it to be opened from the recipient's own inbox before
  a session is created.

---

## How to add a gap

When something is deferred on purpose, append it here rather than leaving it
in a chat. Include:

1. **What** is missing (one sentence).
2. **Why** it is deferred (tiny scale, waiting on a decision, blocked on X).
3. **Trigger** to build it, if there is one. If there isn't, say so.

Keep resolved items in place and mark them done, so we don't rediscover them.
