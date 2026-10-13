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

Status (13 Oct 2026): all migrations applied to both, including
`20261013170000_security_advisor_fixes.sql`. Security advisor is clean apart
from `billing_payments` having no policies, which is intended (service role
only).

Setup for each project:

1. Apply `supabase/migrations/` in timestamp order. Migrations containing
   `drop` statements need approval in Supabase; run them in the SQL Editor.
2. Confirm the public `product-images` bucket and the private ID-document
   bucket exist (created by the storage migrations).
3. Auth → URL configuration: site URL = the dashboard URL; add redirect URLs
   for `/auth/callback` on the dashboard domain (and `localhost:3001` on
   staging).
4. Auth → SMTP: use Resend's SMTP settings. Supabase's built-in email only
   sends to team members, so invites and password resets fail without this.
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

`ANSAA_MOMO_*` and `HUBTEL_*` are Ansaa leftovers and are not set; they are
removed with MoMo billing in stage 2.

## Stripe (stage 3)

- Test mode on Preview and Development, live mode on Production only.
- Products: five template prices ($27 to $97), done-for-you setup ($299),
  hosting ($15/month, $150/year), booking add-on (about $24/month).
- Coupon: $14 off, duration once, applied to hosting at checkout.
- Webhook endpoint on the web app: `/api/stripe/webhook`.
- Connect (stage 5): Express accounts; salons onboard from the dashboard.
