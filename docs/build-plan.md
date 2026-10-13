# Glam Site Studios — build plan

Five stages take the Ansaa copy in this repo to a salon website platform with
Stripe, then add booking. Each stage ends with something that works. The full
plan (pricing, offer, rules) lives in the "melvinasare.com — Hair & Beauty
Sites Plan" doc.

## Stage 1 · Fork and isolate

- [x] Copy Ansaa into this repo (no `.git`, env files or `node_modules`)
- [x] Rebrand: `@glamsite/shared`, `glamsitestudio.com`, product name
- [x] Project rules in `AGENTS.md`
- [ ] New Supabase project; run `supabase/migrations/` in order
- [ ] New Vercel projects for `apps/web` and `apps/dashboard`, with a wildcard
      subdomain on the platform domain
- [ ] Confirm both apps boot on the new infrastructure (gate)

Known leftovers to remove in stage 2: Template A demo images still load from
Ansaa's public storage bucket; MoMo billing env vars (`ANSAA_MOMO_*`); Hubtel
env vars.

## Stage 2 · Strip and reshape for salons

Remove products and everything attached (categories, variants, filters,
reviews, FAQs), cart, checkout, orders, customers, packaging proof and the
fulfilment tier, blog, ID verification, MoMo billing, and the retail
templates.

Keep tenants and RLS, `store_content` with the schema-driven editor, the
domain middleware and subdomains, Supabase Auth, contact enquiries, storefront
events and leads.

- [ ] Squash migrations into one clean baseline
- [ ] Decide on renaming `sellers` to `businesses` in that baseline
- [ ] Prices in minor units plus a `currency` per business
- [ ] `services` and `staff` tables from day one
- [ ] Editor pages: Business, Home, Services, Team, Gallery, Hours and
      location, Booking link
- [ ] Shared salon layout, then salon and barber templates with demo content
- [ ] Booking button links out until stage 5

## Stage 3 · Stripe and the storefront

- [ ] glamsitestudio.com marketing pages: template gallery, live demos,
      pricing, FAQ
- [ ] Stripe products: five template prices ($27 to $97, one-off),
      done-for-you setup ($299, one-off), hosting ($15/month or $150/year),
      booking add-on (about $24/month)
- [ ] First-month hosting for $1: a Stripe coupon for $14 off, applied once
- [ ] Checkout in subscription mode: hosting is always included; the template
      fee and optional setup fee are one-off line items
- [ ] `checkout.session.completed` webhook creates the business and sends a
      Supabase invite
- [ ] Subscription webhooks keep `subscription_status` in sync
- [ ] Billing page opens the Stripe Customer Portal
- [ ] Done-for-you buyers land on an intake form and launch-call link
- [ ] Gate: 10 paying sites

## Stage 4 · Self-serve domains and more templates

- [ ] Dashboard Domain page using the Vercel domains API, with DNS status
- [ ] Nails, lash and brow, and makeup templates
- [ ] Annual plans and in-dashboard upgrade to done-for-you
- [ ] Gate: 30 sites live and owners asking for booking

## Stage 5 · Booking (adapted from Ternarie)

- [ ] Tables: `staff_services`, `working_hours`, `time_off`,
      `booking_settings`, `appointments`
- [ ] Availability engine in `packages/shared`
- [ ] `/book` flow on every site: service, staff, time, details, deposit
- [ ] Stripe Connect onboarding in the dashboard; deposits go to the salon's
      connected account
- [ ] Confirmation and reminder emails; SMS or WhatsApp later
- [ ] Dashboard calendar per staff member and a client list
- [ ] Booking unlocked by the booking add-on on the hosting subscription;
      owners who keep their own tool just paste its link
- [ ] Pilot with 3 site customers
