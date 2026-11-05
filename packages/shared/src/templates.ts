import { SECTION_KEYS, isSectionEnabled, type SectionKey, type SiteContent } from "./site-content";

/**
 * Templates Glam Site Studios sells. Every template reads the same content
 * (./site-content); a template only chooses which sections it shows and how
 * they look.
 *
 * The `id` must match a row in the `templates` table (businesses.template has
 * a foreign key to it). Prices live in that table and in Stripe, not here.
 * `tier`/`priceCents` below are just gallery/filter metadata until pricing is
 * actually wired up; every template is free today.
 */
export type TemplateTier = "single-page" | "multipage" | "premium";

export const TEMPLATE_TIER_LABEL: Record<TemplateTier, string> = {
  "single-page": "Single page",
  multipage: "Multipage",
  premium: "Premium",
};

/** Kind of business a template is designed for. "all" shows up in every filter. */
export type TemplateBusinessType = "salon" | "barber" | "nails" | "lash-brow" | "makeup" | "all";

export type TemplateDefinition = {
  id: string;
  name: string;
  /** One line for the template gallery and the dashboard switcher. */
  tagline: string;
  /** A few sentences for the template details screen. Falls back to the tagline if unset. */
  description?: string;
  /** What this template includes, shown as a bullet list on the details screen. */
  features: string[];
  /** Sections this template shows, in page order. Brand and SEO are always used. */
  sections: SectionKey[];
  /** Business types this template is built for, for the gallery filter. */
  businessTypes: TemplateBusinessType[];
  tier: TemplateTier;
  /** 0 for every free template today; set when paid templates ship. */
  priceCents: number;
};

const ALL_PAGE_SECTIONS = SECTION_KEYS.filter((key) => key !== "brand" && key !== "seo");

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "luxe",
    name: "Luxe",
    tagline: "Premium hair salon, made for textured hair.",
    description:
      "A single-page site built for premium hair salons that specialise in textured hair. Everything a client needs, services, team, gallery, reviews and booking, in one scroll, with a refined, editorial feel.",
    features: [
      "Single-page layout: no clicking between pages",
      "Large photo gallery for showcasing your work",
      "Client reviews section",
      "Online booking built in",
    ],
    // Single page: contact, hours and map share one block near the end.
    sections: ["hero", "about", "services", "team", "gallery", "reviews", "faqs", "contact", "visit", "booking"],
    businessTypes: ["salon"],
    tier: "single-page",
    priceCents: 0,
  },
  {
    id: "salon",
    name: "Salon",
    tagline: "For hair salons and stylists.",
    description:
      "A full multipage site for hair salons and stylists of any size. Covers every part of the customer journey, from discovering your services to booking an appointment.",
    features: [
      "Every section: services, team, gallery, FAQs and more",
      "Works for one stylist or a full team",
      "Online booking built in",
    ],
    sections: ALL_PAGE_SECTIONS,
    businessTypes: ["salon", "nails", "lash-brow", "makeup"],
    tier: "multipage",
    priceCents: 0,
  },
  {
    id: "barber",
    name: "Barber",
    tagline: "For barbershops and men's grooming.",
    description:
      "A full multipage site built for barbershops and men's grooming businesses, with the same full set of sections as Salon, styled for a barbershop feel.",
    features: [
      "Every section: services, team, gallery, FAQs and more",
      "Styling suited to barbershops and men's grooming",
      "Online booking built in",
    ],
    sections: ALL_PAGE_SECTIONS,
    businessTypes: ["barber"],
    tier: "multipage",
    priceCents: 0,
  },
];

export const DEFAULT_TEMPLATE_ID = "luxe";

export function getTemplate(id: string | null | undefined): TemplateDefinition {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}

export function isTemplateId(value: unknown): value is string {
  return typeof value === "string" && TEMPLATES.some((template) => template.id === value);
}

export function templateShowsSection(templateId: string, key: SectionKey): boolean {
  if (key === "brand" || key === "seo") return true;
  return getTemplate(templateId).sections.includes(key);
}

/** Sections to render, in the template's order: supported by the template and not switched off. */
export function visibleSections(templateId: string, content: SiteContent): SectionKey[] {
  return getTemplate(templateId).sections.filter((key) => isSectionEnabled(content, key));
}
