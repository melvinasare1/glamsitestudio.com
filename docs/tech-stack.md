# Ternarie — Tech Stack

## Overview

The technical architecture supports the SaaS product (templates, booking, hosting), payments, and marketing/CRM. Choices are aligned with speed of delivery (e.g. 48-hour launch), scalability, and integration with the growth funnel.

---

## 1. Frontend (SaaS Product & Templates)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | **Next.js** | React-based; SSR/SSG for performance and SEO; good for marketing pages and template-based sites. |
| **Styling** | (Define per project: Tailwind, CSS modules, etc.) | Consistent, fast UI for templates and Ternarie marketing site. |
| **Templates** | Next.js pages/components | Each niche template (barber, salon, nail, lash) is a reusable structure; content and branding are swapped per customer. |

**Why Next.js**: Strong ecosystem, Vercel-native (see Hosting), good for both the Ternarie marketing site and for building out template sites that need SEO and speed.

---

## 2. Hosting

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Primary hosting** | **Vercel** | Hosts Next.js apps (Ternarie site + template-based client sites). Edge, SSL, previews, simple deploys. |
| **Domains** | Vercel + registrar | Custom domains for ternarie.com and client sites; DNS and SSL handled by Vercel. |

**Why Vercel**: Fits Next.js perfectly; minimal DevOps; suitable for many small client sites (e.g. one project per client or multi-tenant approach as you scale).

**Operational note**: Document how you create and deploy each client site (e.g. one repo per client, or one repo with multiple sites/subdomains) so the 48-hour launch process is repeatable.

---

## 3. Payments

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Primary payments** | **Stripe** | Subscriptions (hosting $29, $79, $199), one-time (launch service ~$799), and payment plan ($199/month × 12). |
| **Optional template sales** | **Lemon Squeezy** | Alternative or supplement for selling templates ($199–$499); handles licensing/delivery if needed. |

**Stripe usage**:

- **Recurring**: Products for Basic ($29), Managed ($79), Growth ($199); optionally $0 upfront plan ($199/month, 12-month commitment).  
- **One-time**: Launch in 48 hours (~$799).  
- **Payment plan**: Stripe subscriptions with 12-month minimum; or custom payment plan with Stripe Invoicing.  

**Action items**:

- [ ] Create Stripe products and prices for all tiers.  
- [ ] Implement checkout (Stripe Checkout or Elements) on ternarie.com.  
- [ ] Decide: templates sold via Stripe vs Lemon Squeezy; document in pricing and ops.

---

## 4. Automation / CRM

| Layer | Technology | Purpose |
|-------|------------|---------|
| **CRM & automation** | **GoHighLevel** | Lead management, email/SMS sequences, funnels, and (optionally) booking or form integrations. |
| **Use cases** | — | Nurture leads from melvinasare.com and ternarie.com; onboard new customers; re-engagement; support workflows. |

**Integration**: Forms on ternarie.com (and melvinasare.com) can push leads into GoHighLevel; from there, automate follow-up and segment by offer (template, launch, hosting, $0 upfront).

---

## 5. Booking System

**Context**: Booking is a core product (clients book appointments on the salon’s site). Options:

- **Custom**: Build booking (availability, services, notifications) into the Next.js app; full control, more dev work.  
- **Third-party**: Integrate a booking API or widget (e.g. Calendly-style, or a booking-focused API) into templates; faster to ship, may have per-seat or usage cost.  

**Recommendation**: Document the chosen approach (custom vs vendor) and how it plugs into the template + hosting flow so every 48-hour launch includes working booking.

---

## 6. Template Sales (Optional Platform)

| Option | When to use |
|--------|-------------|
| **Stripe** | Sell templates directly on ternarie.com; full control; one payment stack. |
| **Lemon Squeezy** | If you want a dedicated “digital product” flow (license keys, delivery, tax handling) for template purchases. |

Document the chosen approach in [pricing.md](pricing.md) and in ops so accounting and delivery are clear.

---

## 7. Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│  melvinasare.com (personal brand)                           │
│  → Content, authority, traffic                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ links / funnel
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  glamsitestudio (Next.js on Vercel)                            │
│  → Marketing, pricing, signup, Stripe checkout               │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Stripe       │   │  GoHighLevel  │   │  Client sites  │
│  (payments)   │   │  (CRM/automation) │  (templates   │
│               │   │               │   │   on Vercel)  │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 8. Actionable Tech Checklist

- [ ] Finalize Next.js template structure for each niche (barber, hair salon, beauty, nail, lash).  
- [ ] Define 48-hour launch workflow: repo/deploy per client vs multi-tenant.  
- [ ] Configure Vercel projects and domains for ternarie.com and client sites.  
- [ ] Implement Stripe products and checkout for: subscriptions ($29, $79, $199), launch ($799), and $0 upfront ($199×12).  
- [ ] Set up GoHighLevel and connect forms from both sites; basic nurture sequences.  
- [ ] Choose and integrate booking (custom or vendor) into templates.  
- [ ] Decide template sales: Stripe vs Lemon Squeezy; implement and document.

This stack supports the productized SaaS model and the goal of reaching $10k MRR with minimal unnecessary complexity.
