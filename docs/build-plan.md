# Glam Site Studios — build plan

Five stages take the Ansaa copy in this repo to a salon website platform with
Stripe, then add booking. Each stage ends with something that works. The full
plan (pricing, offer, rules) lives in the "melvinasare.com — Hair & Beauty
Sites Plan" doc.

## Stage 1 · Fork and isolate

- [x] Copy Ansaa into this repo (no `.git`, env files or `node_modules`)
- [x] Rebrand: `@glamsite/shared`, `glamsitestudio.com`, product name
- [x] Project rules in `AGENTS.md`
- [x] Infrastructure spec and env var matrix in `docs/infrastructure.md`
- [x] Supabase org "Glam Site Studio" with production and staging projects;
      all migrations applied to both, security advisor clean
- [ ] Vercel projects `glamsitestudio-web` and `glamsitestudio-dashboard`,
      with a wildcard subdomain on the platform domain
- [ ] Confirm both apps boot on the new infrastructure (gate)

## Stage 2 · Reshape for salons

Done on 13–14 Oct 2026:

- [x] Shared content schema (`packages/shared/src/site-content.ts`), with
      templates declaring which sections they show
- [x] Clean baseline migration replacing all Ansaa migrations: businesses,
      private billing, templates, services and categories, staff, opening
      hours, staff hours and time off, booking settings, clients,
      appointments (no double booking), enquiries, leads, site-media bucket
- [x] RLS test suite (`npm run test:db`), also run against real staging
- [x] Applied to staging and production; security advisor clean
- [x] Web app: host routing, starter layout for every template, demo
      previews, contact form
- [x] Dashboard: Overview with checklist and Publish, Website editor built
      from the schema, Services, Team, Opening hours, Booking link,
      Messages, Business details, Billing placeholder, Support, sign-up
- [x] Removed products, cart, checkout, orders, MoMo, ID verification,
      blog, admin billing and the retail templates

Next in stage 2:

- [ ] Template lineup: 6 designs (3 hair, 2 nails, 1 spa), designed with
      ChatGPT one at a time. Every design comes in two sizes:
      - Single page ($27): the home page with compact prices, contact,
        hours and map; Book buttons go to the owner's booking link
      - Full site ($47, premium $97): Home, Prices, Booking, Contact
      - Prices, Booking and Contact pages each have two shared layout styles
        (A and B), used by every template; each template picks its styles
      - Upgrading from single page to full site keeps all content
- [ ] Multi-page site routing (`/prices`, `/booking`, `/contact`) and the
      shared A/B page styles
- [x] Template 1 "Luxe" (hair), single-page size: `apps/web/src/templates/luxe`,
      demo at `/demo/luxe`, now the default template and the landing page preview.
      Schema additions: hero tagline, optional review star rating
- [ ] Luxe demo photos: about, team (3) and gallery (4+), from the photo list
- [ ] Luxe full-site size (after the Prices, Booking and Contact A/B designs)
- [ ] Vercel projects and environment variables, then test the full flow on
      a preview deployment

## Stage 3 · Stripe and the storefront

Done 2 Nov 2026 (pricing changed from the single-page/full-site plan below to
hosting tiers, each with an email quota, see `packages/shared/src/billing.ts`).
Redesigned 2 Nov 2026 to remove every blocker before payment (Shopify-style):
sign-up asks only for an email, lands straight in a fully-working dashboard,
and payment is required for exactly one thing — launching the site:

- [ ] glamsitestudio.com marketing pages: template gallery, live demos,
      pricing, FAQ
- [x] Stripe pricing: hosting tiers Basic ($15/month, 100 emails), Popular
      ($30/month, 500 emails, choose which emails send), Premium ($60/month,
      1,000 emails, email campaigns); done-for-you setup ($99, one-off). No
      products or prices created by hand — Checkout builds them inline with
      `price_data` (`packages/shared/src/stripe.ts`)
- [x] First-month hosting for $1: a Stripe coupon per hosting tier price,
      duration once, auto-created on first use (`getOrCreateFirstMonthCoupon`)
- [x] Sign-up is email-only: `startSignup` (`apps/dashboard/src/app/signup/actions.ts`)
      creates the login and an empty draft business instantly — no Stripe
      involved, no plan choice — and signs the owner straight into the
      dashboard (an admin-generated magic link, redeemed server-side, so
      there's no "check your email" step)
- [x] Everything in the dashboard (content, services, team, hours, booking
      settings) is open immediately, with no payment check — launching the
      site is the only gated action
- [x] Launch: `startLaunchCheckout` (`apps/dashboard/src/app/(owner)/billing/actions.ts`),
      a $1-first-month Checkout session (Basic tier, subscription mode) from
      the Overview page's `PublishPanel` or the Billing page; the
      `checkout.session.completed` webhook's `confirmLaunch` sets
      `subscription_status: active` and flips the business to `status: live`.
      `setPublished()` re-checks the subscription so going live can't be
      triggered any other way; toggling live/draft afterwards stays free
- [x] Subscription webhooks keep `subscription_status` and
      `current_period_end` in sync
- [x] Billing page opens the Stripe Customer Portal
- [ ] Upgrading hosting tier or adding done-for-you design after launch —
      moved here from sign-up, not yet built (see `docs/follow-ups.md`)
- [ ] Done-for-you buyers land on an intake form and launch-call link
- [ ] Gate: 10 paying sites

## Stage 4 · Self-serve domains and more templates

- [ ] Dashboard Domain page using the Vercel domains API, with DNS status
- [ ] Nails, lash and brow, and makeup templates
- [ ] Annual plans and in-dashboard upgrade to done-for-you
- [ ] Gate: 30 sites live and owners asking for booking

## Stage 5 · Booking (adapted from Ternarie), brought forward

Decided 1 Nov 2026: booking is the backbone of the platform, so it is built
now rather than after 30 live sites. The logic comes from Ternarie's
appointments package (slot engine, booking screens, booking checks, emails),
rewritten onto this repo's own salon tables. Ternarie itself is untouched
(rule 1); no credits, classes or memberships come across (rule 8).

### Phase 1 · Appointments (done, 2 Nov 2026)

- [x] Availability engine in `packages/shared/src/booking.ts`: staff hours
      (or opening hours), service length and clean-up buffer, time off and
      closures, minimum notice, booking window, each business's time zone.
      Unit tests: `npm run test:unit`
- [x] `/book` on every site: service, person (or anyone available), time,
      details. Book buttons go there when Glam Site booking is on
- [x] Booking API re-checks every time; the database's no-double-booking
      rule settles two clients booking at once
- [x] Client's private link (`/appointment/{token}`): view and cancel, with
      the owner's cancellation cut-off
- [x] Emails: client confirmation, owner notice, cancellations (Resend)
- [x] Dashboard Appointments: week view per person, requests to confirm,
      completed and no-show, cancel, owner's notes, add appointments by hand
- [x] Dashboard Booking: rules, each person's working hours, time off and
      closures, booking policy, auto-confirm or review each booking

### Phase 2 · Payments and deposits (Stripe Connect) (done, 2 Nov 2026)

- [x] Connect onboarding in the dashboard (Express accounts); the account id
      goes in `business_billing.stripe_connect_account_id`
- [x] Per service: deposit, full payment up front, or pay at the salon
      (`booking_settings.payment_policy`, `deposit_fixed_cents`)
- [x] Checkout on the salon's connected account; the slot is held as
      "pending" for 15 minutes and released if unpaid
- [x] `checkout.session.completed` webhook confirms the appointment and sets
      `deposit_status`
- [x] Owner records in-salon payments; appointment shows paid, deposit, due
- [x] Decide our platform fee per booking, if any — 1% via
      `PLATFORM_FEE_BPS`, Stripe's `application_fee_amount`
- [x] Discount codes (percent or fixed amount off, optional expiry and
      redemption limit) a client can enter at checkout; applied to the
      amount charged on the salon's connected account, 3 Nov 2026

### Phase 3 · Refunds and no-show rules

- [ ] Client cancels before the cut-off: deposit refunded automatically
- [ ] Late cancel or no-show: deposit kept (`forfeited`), as the policy says
- [ ] Owner refunds from the appointment panel: full or partial
- [ ] Refund and payment history per appointment

### Phase 4 · Waitlist

- [ ] When a day is full, clients join the waitlist for a service, person
      (or anyone) and a date range
- [ ] When a matching time frees up, waitlisted clients get an email with a
      link to book it; first to book gets it
- [ ] Owner sees and manages the waitlist in Appointments

### Phase 5 · Reminders and reschedule

- [ ] Reminder email 24 hours before (scheduled job); SMS or WhatsApp later
- [ ] Clients move their own appointment from the private link
- [ ] Booking unlocked by the booking add-on on the hosting subscription
      (needs stage 3 billing); owners who keep their own tool paste its link
- [ ] Pilot with 3 site customers
