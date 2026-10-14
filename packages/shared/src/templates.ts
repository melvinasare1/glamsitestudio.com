import { SECTION_KEYS, isSectionEnabled, type SectionKey, type SiteContent } from "./site-content";

/**
 * Templates Glam Site Studios sells. Every template reads the same content
 * (./site-content); a template only chooses which sections it shows and how
 * they look.
 *
 * The `id` must match a row in the `templates` table (businesses.template has
 * a foreign key to it). Prices live in that table and in Stripe, not here.
 */
export type TemplateDefinition = {
  id: string;
  name: string;
  /** One line for the template gallery and the dashboard switcher. */
  tagline: string;
  /** Sections this template shows, in page order. Brand and SEO are always used. */
  sections: SectionKey[];
};

const ALL_PAGE_SECTIONS = SECTION_KEYS.filter((key) => key !== "brand" && key !== "seo");

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "luxe",
    name: "Luxe",
    tagline: "Premium hair salon, made for textured hair.",
    // Single page: contact, hours and map share one block near the end.
    sections: ["hero", "about", "services", "team", "gallery", "reviews", "faqs", "contact", "visit", "booking"],
  },
  {
    id: "salon",
    name: "Salon",
    tagline: "For hair salons and stylists.",
    sections: ALL_PAGE_SECTIONS,
  },
  {
    id: "barber",
    name: "Barber",
    tagline: "For barbershops and men's grooming.",
    sections: ALL_PAGE_SECTIONS,
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
