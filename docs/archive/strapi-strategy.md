# Strapi CMS Strategy — Glamsite Studio

## 🧠 Overview

Glamsite Studio uses **Strapi (self-hosted)** as the core CMS powering all client websites.

This decision is based on:

- Multi-tenant SaaS requirements
- Cost efficiency at scale
- Full control over data and permissions
- Ability to evolve into a custom CMS over time

---

## 🎯 Objective

Build a **scalable, multi-tenant CMS system** that allows:

- Each client to manage their own website content
- Complete data isolation between clients
- No per-client CMS cost
- Seamless integration with our Next.js frontend system

---

## 🏗️ Architecture

### Monorepo Structure (Turborepo)

```
/apps
  /web        → marketing site (glamsitestudio.com)
  /dashboard  → client dashboard (future)
  /site       → website renderer (multi-tenant)

/services
  /cms        → Strapi backend

/packages
  /ui         → shared components
  /types      → shared types
  /lib        → API + utilities
```

---

## 🧩 CMS Model (Multi-Tenant)

We use a **single Strapi instance** for all clients.

### Core Principle:

> Every piece of data is linked to a `client`

---

### Data Relationships

```
User → belongs to → Client
Client → owns → Pages
Pages → contain → Blocks (components)
```

---

### Key Collections

#### Client

- name
- slug
- domain
- plan
- subscription status

#### User

- linked to Client
- role (owner / editor)

#### Page

- belongs to Client
- contains dynamic content blocks

---

## 🔐 Security Model

Strict multi-tenant enforcement:

- Every query is filtered by `client`
- Users can ONLY access their own data
- No shared CMS access between clients

> This prevents data leaks and ensures SaaS-grade isolation

---

## 💰 Pricing Strategy (CMS Layer)

Strapi pricing is **NOT per client**, which allows strong margins.

---

### Base Plan ($79/month)

Includes:

- Website
- Hosting
- CMS access (Strapi)
- 1 user (seat)

---

### Additional Seats

- Cost (Strapi): ~$15 per seat (Growth plan)
- Charge: **$20 per seat**
- Profit: **$5 per seat**

---

### Growth Plan ($199/month)

Includes:

- Priority support
- Marketing automation (GoHighLevel)
- Advanced integrations
- More CMS usage support

---

## 📊 Cost Structure

### Early Stage (0–20 clients)

- Strapi: FREE (Community plan)
- Hosting: ~$10–30/month
- Total CMS cost: **~$0–30/month**

---

### Growth Stage (20–100 clients)

- Strapi Growth plan: $45/month
- Additional seats as needed

Example:

| Clients  | Revenue | CMS Cost | Profit Impact    |
| -------- | ------- | -------- | ---------------- |
| 20 × $79 | $1,580  | $45      | ~97% margin      |
| 50 × $79 | $3,950  | $45–$150 | very high margin |

---

### Scale Stage (100+ clients)

- Still 1 Strapi instance
- Costs grow slowly (not per client)
- Margins remain strong

---

## 🚀 Why Strapi Was Chosen

### Compared to Storyblok / SaaS CMS:

| Factor          | Strapi          | Storyblok            |
| --------------- | --------------- | -------------------- |
| Cost per client | $0              | ~$99                 |
| Multi-tenancy   | ✅ Full control | ❌ Limited           |
| Data ownership  | ✅ Full         | ❌ Vendor-controlled |
| Scalability     | ✅ High         | ⚠️ Expensive         |

---

## 🧠 Strategic Advantage

This approach allows us to:

- Scale to **100+ clients without CMS cost explosion**
- Maintain **full control over data**
- Build a **true SaaS platform**, not just templates
- Transition into a **custom CMS in the future**

---

## 🔄 Future Evolution

### Phase 1 (Now)

- Use Strapi as CMS
- Rapid development
- Launch templates

---

### Phase 2

- Add client dashboard
- Improve editing experience
- Automate onboarding

---

### Phase 3

- Replace parts of Strapi with custom backend
- Build proprietary CMS layer
- Fully productized SaaS

---

## 🔥 Key Principle

> Strapi is not the final product — it is the **foundation layer**

We are building:

👉 A scalable **website platform for beauty businesses**

---

## 🏁 Summary

- 1 Strapi instance powers all clients
- Clients are fully isolated via data model
- Costs stay low as we scale
- Revenue grows without CMS constraints

This creates a **high-margin, scalable SaaS business model**
