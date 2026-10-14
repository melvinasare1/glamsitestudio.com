# Glam Site Studios — project rules

Glam Site Studios sells hosted websites to hair and beauty businesses (salons,
barbers, nails, lash and brow, makeup artists). Owners pick a template, edit
their content in a simple dashboard, and their site is served from this
platform. Appointment booking is added later as a paid upgrade.

This repo started as a copy of Ansaa (a multi-tenant storefront platform). The
copy is being reshaped for salons in stages; see `docs/build-plan.md`.

## Rules

1. **Ansaa and Ternarie are read-only.** Copy code out of them; never edit,
   deploy, or run migrations against those projects or their databases.
2. **No shared infrastructure.** This project has its own Supabase, Vercel,
   Stripe and environment variables. Never reuse keys, project ids or URLs from
   Ansaa, Ternarie or Rise Crouch End.
3. **Hair and beauty only.** No new niches until 50 paying sites.
4. **One content schema.** Every template reads the same content structure
   (`packages/shared/src/storefront-content-schema.ts`). A template never adds
   its own fields.
5. **Forms, not a builder.** The dashboard edits content, not layout. No drag
   and drop.
6. **One app serves every site.** Sites are routed by host in
   `apps/web/src/middleware.ts`. No per-customer deploys or per-customer code.
7. **Every query is scoped to one business.** No database read or write
   without the business id, enforced with row-level security.
8. **Appointments, not credits.** Booking is built around services and time
   slots. No credit, membership or class-timetable logic.
9. **Stripe for all payments.**
   - Our revenue (template purchase, hosting subscription) uses Stripe
     Checkout and Billing on the Glam Site Studios account.
   - Money owed to a salon (booking deposits, payments) goes through Stripe
     Connect to the salon's own connected account. Owners connect Stripe from
     the dashboard; we never hold their funds or ask for bank details.
10. **Branches and previews.** No direct pushes to `main`. Preview deployments
    use a staging database, never production.
11. **Ship small.** Only build what a paying customer or the next stage needs.
    Deferred work goes in `docs/follow-ups.md` with a trigger.

## Conventions (inherited from Ansaa)

- TypeScript is camelCase; Postgres is snake_case. Mapping lives in
  `@glamsite/shared/mappers`.
- `app/` is routing; reusable or interactive UI lives in `components/`.
- Never import `@glamsite/shared/supabase/admin` from a `"use client"` file.
- Migrations live in `supabase/migrations/` and run in timestamp order.
