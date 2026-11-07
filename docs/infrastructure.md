# Glam Site Studios — infrastructure

Everything the platform runs on, how it's configured, and which environment
variable goes where. Nothing here is shared with Ansaa, Ternarie or Rise
Crouch End (rule 2 in `AGENTS.md`).

## Services

| Service | Used for | Account / project | Plan |
| --- | --- | --- | --- |
| Supabase | Postgres, Auth, Storage | Org "Glam Site Studio": production and `glamsitestudio-staging` | Free while building; Pro ($25/mo) for production once the first customer is live |
| Vercel | Hosting both apps, subdomains, custom domains, SSL | Team `melvinasare1s-projects`: `glamsitestudio-web`, `glamsitestudio-dashboard` | Pro ($20/mo) before launch (Hobby is non-commercial) |
| Stripe | Checkout, hosting subscriptions, Customer Portal; later Connect for salon deposits | Glam Site Studios account (UK) | Pay per transaction |
| Resend | Transactional email, and Supabase Auth email via custom SMTP | Domain `glamsitestudio.com` | Free (3,000/mo) to start |
| Registrar | `glamsitestudio.com` | — | ~$12/yr |

## Supabase

Two projects in the "Glam Site Studio" org (account glamsitestudio@gmail.com),
both in Ireland (`eu-west-1`):

| Project | Ref | Used by |
| --- | --- | --- |
| Production ("glamsitestudio@gmail.com's Project") | `ufrfhimjmvltpdtcoord` | Production deployments only |
| `glamsitestudio-staging` | `idlqgpervgglazzozhkb` | Local development and Vercel previews (rule 10) |

Status (2 Nov 2026): everything in `supabase/migrations/` is applied to both,
up to `20261102090000_booking_core.sql`. Security advisor is clean apart from
`leads` having no policies, which is intended (server only). Every change,
with times and how to undo it, is in `docs/database-changes.md`.

Setup for each project:

1. Apply `supabase/migrations/` in timestamp order, following
   `docs/database-changes.md` (staging first, undo script ready, log entry).
   Migrations containing `drop` statements need approval in Supabase; run
   them in the SQL Editor and record that in the log.
2. Confirm the public `site-media` bucket exists (created by the baseline).
3. Auth → URL configuration: site URL = the dashboard URL; add redirect URLs
   for `/auth/callback` on the dashboard domain (and `localhost:3001` on
   staging).
4. Auth → SMTP: not required. Every auth email the app sends (sign-up's
   sign-in link, password reset) is generated server-side with
   `admin.auth.admin.generateLink()` and emailed ourselves through Resend's
   HTTP API (`packages/shared/src/email.ts`), not Supabase's own mailer —
   see `apps/dashboard/src/app/signup/actions.ts` and `login/actions.ts`.
   Supabase's built-in email only reaches project team members, which is
   exactly why this app never relies on it.
5. Run the security and performance advisors and fix anything flagged.

## Vercel

Two projects, both linked to `melvinasare1/glamsitestudio.com`, production
branch `main`:

| Setting | `glamsitestudio-web` | `glamsitestudio-dashboard` |
| --- | --- | --- |
| Root directory | `apps/web` | `apps/dashboard` |
| Framework | Next.js | Next.js |
| Install / build | From `apps/web/vercel.json` | From `apps/dashboard/vercel.json` |
| "Include files outside the root directory" | On | On |
| Function region | London (`lhr1`) | London (`lhr1`) |
| Domains (later) | `glamsitestudio.com`, `www.`, `*.glamsitestudio.com`, customer domains | `dashboard.glamsitestudio.com` |

The wildcard `*.glamsitestudio.com` needs the domain's nameservers pointed at
Vercel. Customer subdomains (`{slug}.glamsitestudio.com`) are then routed by
`apps/web/src/middleware.ts`.

## Environment variables

Set in both Vercel projects. **Production** values point at the production
Supabase project; **Preview** and **Development** values point at staging.

| Variable | web | dashboard | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | yes | Sensitive. Server only |
| `NEXT_PUBLIC_WEB_URL` | yes | yes | `https://glamsitestudio.com` |
| `NEXT_PUBLIC_DASHBOARD_URL` | yes | yes | `https://dashboard.glamsitestudio.com` |
| `ADMIN_EMAILS` | — | yes | Comma-separated admin logins |
| `RESEND_API_KEY` | — | yes | Sensitive |
| `RESEND_FROM_EMAIL` | — | yes | e.g. `Glam Site Studios <hello@glamsitestudio.com>` |
| `SUPPORT_INBOX_EMAIL` | — | yes | Where support tickets go |
| `STRIPE_SECRET_KEY` | stage 3 | stage 3 | Sensitive. Test key on Preview |
| `STRIPE_WEBHOOK_SECRET` | stage 3 | — | Sensitive. One per environment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | stage 3 | stage 3 | |
| `PLATFORM_FEE_BPS` | stage 5 | — | Optional, basis points (1% = 100), default 100. Booking Checkout + webhook only run on web |

`ANSAA_MOMO_*` and `HUBTEL_*` are Ansaa leftovers and are not set; they are
removed with MoMo billing in stage 2.

## Stripe (stage 3)

- Test mode on Preview and Development, live mode on Production only.
- No Products or Prices to create by hand: the dashboard's Checkout Session
  builds line items inline with `price_data` (see
  `packages/shared/src/stripe.ts` and `apps/dashboard/src/app/signup/actions.ts`).
- Hosting, recurring monthly, chosen at sign-up: Basic $15, Popular $30,
  Premium $60 (`HOSTING_TIER_PRICE_CENTS` in `packages/shared/src/billing.ts`,
  also the source for each tier's email quota). Done-for-you setup is a $99
  one-off line item, added only when chosen.
- Coupon: $1 for the first month of hosting, duration once. One coupon per
  hosting tier price, auto-created on first use with a deterministic id
  (`getOrCreateFirstMonthCoupon`) — nothing to set up in the Stripe dashboard.
- `checkout.session.completed` creates the business, `business_billing`,
  `booking_settings` and `email_notification_settings` rows, and invites the
  owner by email (Supabase `inviteUserByEmail`); `customer.subscription.updated`
  and `.deleted` keep `subscription_status` and `current_period_end` in sync.
  Webhook endpoint, on the web app: `/api/stripe/webhook`.
- Customer Portal: the billing page's "Manage billing" button opens it
  directly against the business's `stripe_customer_id`.
- Connect (stage 5): Express accounts; salons onboard from the dashboard.
  Our cut of a booking payment is Stripe's `application_fee_amount` on a
  destination charge, computed by `platformFeeCents()` in
  `packages/shared/src/billing.ts` from `PLATFORM_FEE_BPS` (default 100 =
  1%) — change the rate by updating the env var, no redeploy needed.
- Connect webhook setup: Express account events (`account.updated`,
  `payout.failed`) only reach `/api/stripe/webhook` if "Listen to events on
  connected accounts" is enabled for that endpoint in the Stripe Dashboard
  (or, for local testing, `stripe listen --forward-connect-to localhost:3000/api/stripe/webhook`
  alongside the regular `--forward-to`). Easy to miss — without it,
  `stripe_connect_charges_enabled` never flips to true.
- `payout.failed`: a salon's automatic payout to their bank bounced (closed
  account, bad details). Emails the owner (link to Billing to fix it) and
  `SUPPORT_INBOX_EMAIL`, since the money just sits in their Stripe balance
  until they do.
