# Glam Site Studios — platform scaffold

Hosted websites (and later booking) for hair and beauty businesses.

This codebase is a copy of Ansaa, a multi-tenant storefront platform, and is
being reshaped for salons in stages. Read [AGENTS.md](AGENTS.md) for the
project rules and [docs/build-plan.md](docs/build-plan.md) for the stages.
Much of the README below still describes Ansaa's product shop until stage 2.
Earlier strategy notes are kept in [docs/archive](docs/archive).

Two independently deployable Next.js apps share one Supabase Postgres project,
scoped by `seller_id`.

## Folder structure

```
apps/
  web/                         Public site (port 3000)
    src/app/(marketing)/       Landing + /signup lead capture
    src/app/store/             Storefront templates
    src/app/api/leads/         Signup form → `leads` table
    src/lib/cart-context.tsx   Storefront cart

  dashboard/                   Seller admin (port 3001)
    src/app/dashboard/         Overview, orders, products, customers, analytics, settings
    src/app/login/             Seller login
    src/app/signup-seller/     Create seller Auth user + `sellers` row
    src/app/api/products/      Create product (auth required)
    src/components/dashboard/  Shared seller-admin UI

packages/
  shared/                      Imported by both apps as `@glamsite/shared`
    src/supabase/              Browser, server, admin, env helpers, auth middleware
    src/mappers.ts             snake_case rows ↔ camelCase TS types
    src/types/index.ts         Seller, Product, Order, DailyMetric, SignupLead

supabase/migrations/           Postgres schema + RLS (repo root — one shared database)
```

`app/` is routing. UI that is reused or interactive lives in `components/`.
Do not import `@glamsite/shared/supabase/admin` from `"use client"` files.

TypeScript keeps camelCase (`sellerId`, `priceCedis`). Postgres columns are
snake_case (`seller_id`, `price_cedis`). Mapping happens in `@glamsite/shared/mappers`.

## Routing model (important)

Right now storefronts are path-based template previews on the **web** app:
`/store/template-a`, `/store/sneaker-template`, `/store/kitchenware-template`,
`/store/motorbike-template`, or `/store/imports-template`. Templates are generic — they are not tied to a
seller. When a client site is needed, copy a template and customize that copy.

In production you want each seller's own domain to serve their storefront directly
(`makeup.com` → a copied client site), and the dashboard to live on a
subdomain (`dashboard.makeup.com`). That's a `middleware.ts` job on each app: read
the incoming `Host` header, look up which seller/template owns that domain, and
rewrite the request to the right internal route. Not built yet — see
[docs/follow-ups.md](docs/follow-ups.md) (trigger: before customer #4).

## Setup

1. `npm install` from the repo root (npm workspaces)
2. Create a Supabase project. In the SQL editor (or `supabase db push`), run
   the files in `supabase/migrations/` in timestamp order. The product-images
   storage migration needs a public bucket named `product-images`; if
   `storage.buckets` inserts are blocked, create that bucket in the dashboard
   (Storage → New bucket → Public) then re-run the policy statements.
3. Copy `.env.local.example` to `apps/web/.env.local` **and**
   `apps/dashboard/.env.local` and fill in the same values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; Project Settings → API)
4. `npm run seed:storefront` — optional, seeds the Styleco demo catalog
5. Run one or both apps (see below)
6. Open http://localhost:3000/store/template-a (web)
   and http://localhost:3001/login (dashboard)

## Running apps independently

From the repo root. npm needs `--` so Turbo receives `--filter`:

```bash
# Public site (marketing + storefronts) — http://localhost:3000
npm run dev -- --filter=web
# or: npm run dev:web

# Seller admin — http://localhost:3001
npm run dev -- --filter=dashboard
# or: npm run dev:dashboard

# Both apps at once
npm run dev
```

npm needs `--` so Turbo receives `--filter`. Same thing via Turbo directly:
`npx turbo dev --filter=web` / `npx turbo dev --filter=dashboard`.

Each app is a separate Next.js project and can be deployed on its own (two
Vercel projects, same env vars, same Supabase project).

The dashboard login page still links to `/signup` (early-access waitlist). That
route lives on **web**. When the apps run on different origins, point that link
at the web URL.

Seller login / Supabase Auth is a separate step. The dashboard currently
redirects unauthenticated visits to `/login`.

## What's mocked and needs wiring next

Current deferred work and pre-scale triggers live in
[docs/follow-ups.md](docs/follow-ups.md). The list below is older scaffold notes.

1. **Auth** — seller login for the dashboard (Supabase Auth). Ask before wiring this.
2. **Products CRUD** — list/create against Postgres; next is edit/delete and image storage.
3. **Orders + checkout** — build `/api/checkout` to create a Hubtel/Paystack payment
   intent, then wire the storefront cart's "Pay now" button to hit it.
4. **Dashboard reads** — swap mock arrays in `dashboard/page.tsx`,
   `dashboard/orders`, `dashboard/analytics` for real queries scoped to
   `seller_id`.
5. **`daily_metrics` aggregation** — a scheduled job that rolls up daily
   impressions/orders/revenue per seller.
6. **Packaging proof** — an upload flow in the dashboard for the packing photo/video
   at dispatch.

## Row Level Security

Policies live in the init migration and match the old Firestore rules:

- `sellers` / `products` — public read; owner write (`auth.uid() = seller_id` / `id`)
- `orders` — public insert (checkout); owner read/update
- `daily_metrics` — owner read; writes only via the service role
- `leads` — public insert; no client reads

Until Auth is wired, `auth.uid()` is null, so owner policies do not match. Public
storefront reads still work. Server routes that need to write (leads, seed, seller
signup without a session) use `SUPABASE_SERVICE_ROLE_KEY`.
