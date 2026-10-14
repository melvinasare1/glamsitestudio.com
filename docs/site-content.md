# Site content: sections and fields

Every Glam Site Studios template reads the same content. The source of truth
is `packages/shared/src/site-content.ts`; this page explains it.

- The dashboard's **Website** editor builds one form per section from that
  file, so it works with every template without template-specific code.
- Each template (`packages/shared/src/templates.ts`) lists the sections it
  shows, in page order. Switching template keeps everything the owner entered.
- Optional sections have a "Show this section" toggle.
- Services, team members and opening hours are database tables, because
  booking needs them. Their sections only hold a heading and intro; the rows
  are edited on their own dashboard pages.

## Sections

| Section | Fields | Edited where |
| --- | --- | --- |
| Brand (always on) | Logo, main colour, accent colour, font style | Website editor |
| Top of page | Headline, line under it, main photo, button text | Website editor |
| About | Heading, your story, photo | Website editor |
| Services | Heading, intro | Services page: categories, name, duration, price (or "from" price), description, show on site, bookable online |
| Team | Heading, intro | Team page: name, role, bio, photo, services they do |
| Gallery | Heading, up to 24 photos with captions | Website editor |
| Reviews | Heading, up to 12 reviews (quote, client name, where left) | Website editor |
| FAQs | Heading, up to 20 questions and answers | Website editor |
| Opening hours & location | Heading, getting-here notes, show map | Opening hours page; address in Business details |
| Contact & socials | Heading, intro, message form on/off, Instagram, TikTok, Facebook, WhatsApp | Website editor |
| Booking banner | Heading, text, button text | Website editor; where Book buttons go is on the Booking page |
| Search & sharing (always on) | Page title, description, sharing image | Website editor |

## Adding a field or section

1. Add it to `SITE_SECTIONS` in `site-content.ts` (the editor picks it up).
2. Render it in the templates that should show it.
3. Add the section key to those templates' `sections` list.

A template never defines its own fields (rule 4 in `AGENTS.md`).
