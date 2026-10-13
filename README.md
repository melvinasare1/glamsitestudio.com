# Glam Site Studios

Hosted websites, and later online booking, for hair and beauty businesses.
Owners pick a template, fill in their details in a simple dashboard, and
their site is served from this platform.

Read [AGENTS.md](AGENTS.md) for the project rules. The build stages are in
[docs/build-plan.md](docs/build-plan.md), the site content model in
[docs/site-content.md](docs/site-content.md), and services, environment
variables and Supabase projects in [docs/infrastructure.md](docs/infrastructure.md).

## Structure

```
apps/
  web/          Public sites (port 3000)
    src/middleware.ts          {slug}.glamsitestudio.com or a custom domain → /sites/{slug}
    src/app/sites/[slug]/      A live salon site
    src/app/demo/[template]/   Template preview with demo content
    src/app/api/contact/       Site contact form → enquiries
    src/templates/             One component per template (starter layout for now)
  dashboard/    Owner dashboard (port 3001)
    src/app/dashboard/         Overview, Website, Services, Team, Opening hours,
                               Booking, Messages, Business details, Billing, Support
    src/app/signup/            Temporary self-serve sign-up (Stripe checkout in stage 3)

packages/shared/   @glamsite/shared, used by both apps
  site-content.ts  The sections and fields every template reads (rule 4)
  templates.ts     Templates and the sections each shows
  types.ts, mappers.ts, format.ts, domain.ts, demo.ts, supabase/*

supabase/
  migrations/      Schema and row-level security
  tests/           npm run test:db: RLS and booking rules on an in-memory Postgres
  one-off/         Scripts that were run once by hand
```

## Running locally

1. `npm install`
2. Copy `.env.local.example` to `apps/web/.env.local` and
   `apps/dashboard/.env.local`, using the **staging** Supabase keys.
3. `npm run dev` (both apps), or `npm run dev:web` / `npm run dev:dashboard`.
4. Open http://localhost:3000/demo/salon and http://localhost:3001/signup.

On localhost, a site is at http://localhost:3000/sites/{slug} once published.

## Checks

- `npm run test:db` runs the database security checks.
- `npm run build` type-checks, lints and builds both apps.

## Data model, in short

Every row belongs to one business (`business_id`) and row-level security keeps
businesses apart. Live sites and their visible services, team and hours are
public; everything else is owner-only, and billing is written only by server
code. Appointments can't double-book a team member (exclusion constraint).
See the comments at the top of `supabase/migrations/20261014090000_baseline.sql`.
