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
- [ ] Template 1 ("Luxe", hair) from the ChatGPT designs
- [ ] Vercel projects and environment variables, then test the full flow on
      a preview deployment

## Stage 3 · Stripe and the storefront

- [ ] glamsitestudio.com marketing pages: template gallery, live demos,
      pricing, FAQ
- [ ] Stripe products: single page ($27), full site ($47), premium full
      site ($97), upgrade (the difference), all one-off;
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
