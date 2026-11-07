# Glam Site Studios: follow-ups

Work deferred on purpose, with the trigger for building it. Only build an item
when its trigger is hit, or when we decide to. Keep resolved items, marked done.

## Deferred after stage 2

- **Opening hours save as delete-then-insert**, not one transaction. A failure
  between the two leaves no hours. Trigger: if it ever happens, move to a
  database function.
- **Custom-domain lookups in middleware hit the database on every request.**
  Trigger: first custom domain goes live; add caching.
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

## Deferred after booking phase 1

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

- **Done-for-you had no fulfillment flow.** The landing page's "done for
  you" lead form asked for an intake write-up and just said "we'll be in
  touch" — no call ever got booked, and leads were inserted with no
  notification, so nobody on the team knew to follow up. Fixed: the form
  (`apps/web/src/components/marketing/LeadForm.tsx`) now asks for a time to
  call instead of free-text details, picked from
  `callSlotOptions()` (`packages/shared/src/call-slots.ts`, weekdays, UK
  office hours, at least a day's notice — reuses `booking.ts`'s timezone
  helpers, not its per-business availability engine, since this is our own
  team's calendar, not a salon's). `/api/leads` validates the submitted
  time with `isValidCallSlot()` before storing it as `leads.call_at`
  (`supabase/migrations/20261108000000_leads_call_at.sql`) and emails
  `SUPPORT_INBOX_EMAIL` via the new `doneForYouCallEmail()` template
  (`packages/shared/src/email.ts`) so the booked time doesn't go unnoticed.

- **Draft preview.** Owners couldn't see their site until it was published,
  because public pages read as an anonymous visitor and `businesses_read`
  RLS only returns `status = 'live'` rows to anon. Fixed: every business
  gets a `preview_token` (uuid, `supabase/migrations/20261107000000_business_preview_token.sql`),
  and `apps/web/src/app/sites/[slug]/preview/[token]/page.tsx` renders the
  site via `loadDraftSite()` (`apps/web/src/lib/site.ts`), which uses the
  service-role client and checks the token instead of relying on RLS —
  `businesses_read` is unchanged, so anonymous visitors still only ever see
  live sites. The dashboard's publish panel links to this with a "Preview"
  button, before and after launch, whenever the site isn't live. The token
  is stripped from the `Business` object before it reaches a live site's
  own page (`loadSite`/`loadSections` in the same file), so it's never sent
  to a visitor's browser.

- **Two versions of the icon library** (`lucide-react` 1.x in the dashboard,
  0.408 in the site app) caused a hydration error on the dashboard header's
  menu icon on every login. Fixed: downgraded the dashboard to `^0.408.0`
  (`apps/dashboard/package.json`) to match the site app, the version already
  proven in this codebase; the `Icon`-suffixed names the dashboard uses
  (`ArrowDownIcon`, `CircleCheckIcon`, etc.) exist at 0.408.0 too, confirmed
  by a clean `tsc --noEmit` and `next build` on the dashboard.

- **Any owner could turn on Glam Site booking for free.** It should come
  with the booking add-on; the trigger (stage 3 billing) was hit but the
  gate was never built. Fixed: `business_billing.booking_addon` (already in
  the schema, defaulting to `false`) is now enforced — `saveBooking`
  (`apps/dashboard/src/app/(owner)/booking/actions.ts`) refuses `"glamsite"`
  mode unless it's on, and the Booking page's mode picker shows the option
  locked with a link to Billing. Owners turn it on from the new "Booking
  add-on" panel on the Billing page (`enableBookingAddon`/
  `disableBookingAddon`, `apps/dashboard/src/app/(owner)/billing/actions.ts`):
  $10/month as a second item on their existing hosting subscription, the
  same price_data-on-a-subscription-item approach `changeHostingTier`
  already uses. Businesses already using Glam Site booking before this
  shipped were grandfathered in by
  `supabase/migrations/20261106000000_booking_addon_gate.sql`, so nobody
  already relying on it lost it unannounced.

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

- **Password reset still relied on Supabase's unconfigured email sender.**
  `resetPasswordForEmail` on `/login` sent through Supabase Auth's own
  mailer, which (per docs/infrastructure.md) only reaches project team
  members until SMTP is hand-configured in the Supabase dashboard. Fixed
  the same way sign-up's sign-in link works: `requestPasswordReset`
  (`login/actions.ts`) generates the recovery link itself
  (`admin.auth.admin.generateLink`) and emails it through Resend, so it no
  longer depends on that dashboard setting. The support ticket route was
  also moved off a direct `resend` SDK call onto the same shared
  `sendEmail()` helper, so every outgoing email in the app now goes through
  one path.

- **No rate limit on the public booking API** (and contact/leads/support).
  Added a Postgres-backed fixed-window limiter (`check_rate_limit()`,
  `supabase/migrations/20261105000000_rate_limits.sql`, called via
  `@glamsite/shared/rate-limit`) keyed by IP for the public routes and by
  user id for the authenticated support route. An in-memory counter
  wouldn't work across Vercel's serverless instances, so this uses the
  database every instance already shares.

---

## How to add a gap

When something is deferred on purpose, append it here rather than leaving it
in a chat. Include:

1. **What** is missing (one sentence).
2. **Why** it is deferred (tiny scale, waiting on a decision, blocked on X).
3. **Trigger** to build it, if there is one. If there isn't, say so.

Keep resolved items in place and mark them done, so we don't rediscover them.
