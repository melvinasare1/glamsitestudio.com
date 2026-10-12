# Glam Site Studios — project overview

One place for what Glam Site Studios is, who it is for, how the apps fit together, and the stack behind them. Setup steps stay in the root [README](../README.md). Deferred work stays in [follow-ups.md](./follow-ups.md).

---

## What it is

Glam Site Studios is a multi-tenant storefront platform for Ghanaian sellers. A seller picks a template, gets a shop they can put on their own domain, and runs products and orders from an admin dashboard. Buyers pay the seller directly by Mobile Money. There is no payment processor in the middle: the seller marks each order paid, unpaid, or cancelled.

There are two commercial plans:

| Plan | Monthly fee | What the seller gets |
| --- | --- | --- |
| Website & Admin | GHS 250 | Storefront, dashboard, manual MoMo order tracking, email support |
| Fulfilment | GHS 400 | Everything above, plus Glam Site Studios stores stock, packs, and dispatches, with photo proof at intake and before dispatch |

New sellers start on a 30-day trial. After that, subscription status is `trialing`, `active`, or `overdue`. An admin confirms a MoMo subscription payment by matching a permanent 6-digit billing reference. That billing flow is separate from buyer checkout.

---

## Who uses it

- **Buyers** shop a seller’s storefront: browse, search, view a product, add to cart, and check out by sending MoMo to the seller’s number.
- **Sellers** sign up, verify identity, publish a store, manage catalogue and orders, and edit storefront copy.
- **Glam Site Studios admins** review new sellers, confirm subscription payments, and oversee accounts from the dashboard admin area.

---

## How the product works

1. A seller chooses one of six templates and completes onboarding (account, ID, store details).
2. They add products (images, prices in cedis, variants, stock) in the dashboard.
3. Buyers visit the storefront. On a custom domain, the web app looks up the host and serves that seller’s template and catalogue. Template preview URLs (`/store/{template}` and `/store/{template}/{slug}`) still work for demos and seller shops on the platform host.
4. Checkout creates an order in `pending_payment` and shows the seller’s MoMo number plus a payment reference.
5. The seller updates the order as it moves through packing and dispatch. Fulfilment-tier shops are meant to hand packing to Glam Site Studios; packaging proof fields exist on the order for that.

Money the buyer sends never passes through Glam Site Studios. Glam Site Studios’s own subscription (the GHS 250 / 400 fee) is also MoMo, tracked separately on the seller record.

---

## Storefront templates

Templates are generic layouts. A seller’s catalogue, copy, and domain are data; the template is which UI they use.

| ID | Marketing name | Suited to |
| --- | --- | --- |
| `template-a` | Simple | Minimal general ecommerce |
| `sneaker-template` | Kicks | Footwear and streetwear |
| `kitchenware-template` | Kitchenware | Home and kitchen goods |
| `motorbike-template` | Ride | Motorbikes, bicycles, mopeds, scooters (includes a blog) |
| `imports-template` | Imports | Grocery and everyday imported goods |
| `hair-beauty-template` | Hair & Beauty | Wigs, bundles, and hair retail |

Demo catalogues ship with each template so previews work without a live seller. When a request is for a real seller (`/store/{template}/{slug}` or a verified custom domain), the storefront reads that seller’s products and store content from Postgres.

---

## Apps

Two Next.js apps, deployed independently, share one Supabase project. Every tenant row is scoped by `seller_id`.

### `apps/web` — public site (port 3000)

- Marketing landing and signup (`/`, `/signup`, `/login`)
- All storefront templates under `/store/...`
- Host-based rewrite in `middleware.ts`: a verified custom domain is rewritten to that seller’s storefront
- Cart is client state; checkout posts to the server

API routes:

| Route | Role |
| --- | --- |
| `POST /api/checkout` | Create an order from the cart and return MoMo payment details |
| `POST /api/leads` | Marketing signup → `leads` |
| `POST /api/contact` | Storefront contact form → `contact_enquiries` |
| `POST /api/reviews` | Product reviews |
| `POST /api/track` | Storefront analytics events |

### `apps/dashboard` — seller admin (port 3001)

Seller areas: overview, products (create, edit, images, variants), orders, customers, analytics, storefront editor, settings, billing, support, ID verification, and blog (Ride template only).

Admin areas: seller review (`/dashboard/admin`) and subscription payment confirmation (`/dashboard/admin/billing`).

Auth is Supabase Auth: login, signup, password reset, and an auth callback. Unauthenticated visits go to `/login`.

### `packages/shared` — `@glamsite/shared`

Shared by both apps. TypeScript types, snake_case ↔ camelCase mappers, Supabase browser/server/admin clients, store-domain helpers, ID-verification helpers, and the storefront content schema. Do not import `@glamsite/shared/supabase/admin` from client components.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | npm workspaces + Turborepo |
| Apps | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS (v3 on web, v4 on dashboard). Dashboard UI uses shadcn/Radix, `react-hook-form` + Zod, TanStack Table, Recharts, dnd-kit |
| Icons | lucide-react |
| Data | Supabase Postgres, Row Level Security, Auth, Storage (`product-images` bucket; private bucket for ID documents) |
| Email | Resend (dashboard) |
| Analytics | `@vercel/analytics` on both apps; custom storefront events also written to `storefront_events` |
| Hosting model | Two Vercel projects, same env vars, same Supabase project |
| Currency | Ghana cedis (`price_cedis` / `priceCedis`) |
| Payments | Manual Mobile Money. No Hubtel/Paystack in the checkout path |

TypeScript stays camelCase (`sellerId`, `priceCedis`). Postgres columns stay snake_case (`seller_id`, `price_cedis`). Mapping lives in `@glamsite/shared/mappers`.

---

## Data model

Schema lives in `supabase/migrations/`, applied in timestamp order. Core tables:

| Table | What it holds |
| --- | --- |
| `sellers` | Tenant: business, slug, template, domain, pricing tier, trial, subscription, MoMo number, verification, editable store content |
| `products` | Catalogue: price, images, stock, variants, categories, features |
| `orders` | Checkout lines, buyer details, status, payment reference, packaging proof |
| `customers` | Buyers seen on a seller’s orders |
| `daily_metrics` | Rolled-up impressions, orders, revenue (service-role writes) |
| `leads` | Marketing waitlist / signup captures |
| `contact_enquiries` | Storefront contact messages |
| `storefront_events` | Page and commerce events |
| `store_blog_posts` | Blog posts (Ride) |
| `billing_payments` | Confirmed Glam Site Studios subscription payments |
| Reviews / FAQs | Product reviews and store FAQs (later migrations) |

Row Level Security, in short: products and sellers are publicly readable; owners write their own rows; orders can be inserted at checkout and read/updated by the owner; leads and metrics are not readable from the browser. Server routes that must bypass RLS use `SUPABASE_SERVICE_ROLE_KEY`.

Order statuses include `pending_payment`, `paid`, `packed`, `dispatched`, `delivered`, returns, `cancelled`, and `refunded`.

---

## Repo map

```
apps/web/            Public marketing site + storefronts
apps/dashboard/      Seller and admin dashboard
packages/shared/     Types, mappers, Supabase clients, shared domain logic
supabase/migrations/ Postgres schema and RLS
scripts/             seed:storefront and other one-off scripts
docs/                This overview and follow-ups
```

---

## Local development

From the repo root:

```bash
npm install
npm run dev          # both apps
npm run dev:web      # http://localhost:3000
npm run dev:dashboard # http://localhost:3001
```

Copy `.env.local.example` into `apps/web/.env.local` and `apps/dashboard/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

Apply `supabase/migrations/` with `supabase db push` (or the SQL editor) before expecting live data. `npm run seed:storefront` loads a demo catalogue.

Useful local URLs:

- Marketing: http://localhost:3000
- Template previews: http://localhost:3000/store/template-a (and the other template paths)
- Seller login: http://localhost:3001/login

---

## What is still open

Custom domains are looked up in middleware when a host is already stored and verified on the seller. Self-serve DNS, automated seller emails, locking the dashboard after trial expiry, and a few analytics/billing polish items are intentionally deferred. See [follow-ups.md](./follow-ups.md).
