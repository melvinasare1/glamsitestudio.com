/**
 * The one content structure every Glam Site Studios template reads (rule 4).
 *
 * The dashboard's website editor renders its forms from SITE_SECTIONS, and
 * each template declares which of these sections it shows (see ./templates).
 * A template never adds fields of its own, so an owner can switch template
 * without re-entering anything.
 *
 * Services, team members and opening hours are real tables (booking needs
 * them). Their sections here only hold the heading and intro text; the rows
 * are edited on their own dashboard pages (`managedBy`).
 */

export type SectionKey =
  | "brand"
  | "hero"
  | "about"
  | "services"
  | "team"
  | "gallery"
  | "reviews"
  | "faqs"
  | "visit"
  | "contact"
  | "booking"
  | "seo";

export type ScalarFieldType = "text" | "textarea" | "image" | "url" | "color" | "select" | "toggle";

export type SelectOption = { value: string; label: string };

export type ScalarField = {
  key: string;
  label: string;
  type: ScalarFieldType;
  description?: string;
  placeholder?: string;
  /** Characters allowed for text, textarea and url fields. */
  maxLength?: number;
  options?: SelectOption[];
  /** Used when the owner leaves the field empty. */
  defaultValue?: string | boolean;
};

export type ListField = {
  key: string;
  label: string;
  type: "list";
  description?: string;
  itemLabel: string;
  maxItems: number;
  itemFields: ScalarField[];
};

export type ContentField = ScalarField | ListField;

export type SectionDefinition = {
  key: SectionKey;
  label: string;
  description: string;
  fields: ContentField[];
  /** Section rows are edited on another dashboard page. */
  managedBy?: { label: string; href: string };
  /** Brand and SEO apply to the whole site and can't be hidden. */
  alwaysOn?: boolean;
};

export type ListItem = Record<string, string>;
export type FieldValue = string | boolean | ListItem[];
export type SectionValues = Record<string, FieldValue>;
export type SiteContent = Partial<Record<SectionKey, SectionValues>>;

/** Every optional section starts with this toggle. */
const SHOW: ScalarField = {
  key: "show",
  label: "Show this section on my site",
  type: "toggle",
  defaultValue: true,
};

export const FONT_OPTIONS: SelectOption[] = [
  { value: "elegant", label: "Elegant (serif headings)" },
  { value: "modern", label: "Modern (clean sans-serif)" },
  { value: "soft", label: "Soft (rounded)" },
];

export const REVIEW_RATING_OPTIONS: SelectOption[] = [
  { value: "none", label: "No stars" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

/** A review's star rating (1–5), or null when the owner didn't add one. */
export function reviewRating(item: ListItem): number | null {
  const value = Number(item.rating);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export const SITE_SECTIONS: SectionDefinition[] = [
  {
    key: "brand",
    label: "Brand",
    description: "Your logo, colours and fonts, used across the whole site.",
    alwaysOn: true,
    fields: [
      {
        key: "logo",
        label: "Logo",
        type: "image",
        description: "Shown in the header. Leave empty to show your business name instead.",
      },
      {
        key: "primaryColor",
        label: "Main colour",
        type: "color",
        description: "Buttons, links and highlights.",
        defaultValue: "#1f1a17",
      },
      {
        key: "accentColor",
        label: "Accent colour",
        type: "color",
        description: "Backgrounds and small details.",
        defaultValue: "#f3ebe4",
      },
      {
        key: "font",
        label: "Font style",
        type: "select",
        options: FONT_OPTIONS,
        defaultValue: "elegant",
      },
    ],
  },
  {
    key: "hero",
    label: "Top of page",
    description: "The first thing visitors see: a headline, a line underneath and a big photo.",
    fields: [
      SHOW,
      {
        key: "tagline",
        label: "Small line above the headline",
        type: "text",
        description: "Optional. Some templates show it in small capitals.",
        placeholder: "e.g. Premium hair salon · London",
        maxLength: 60,
      },
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "e.g. Healthy hair, beautifully done",
        maxLength: 80,
      },
      {
        key: "subheadline",
        label: "Line under the headline",
        type: "textarea",
        placeholder: "e.g. Colour, cuts and silk presses in the heart of Crouch End.",
        maxLength: 200,
      },
      { key: "image", label: "Main photo", type: "image", description: "A wide photo works best." },
      {
        key: "ctaLabel",
        label: "Button text",
        type: "text",
        placeholder: "Book now",
        maxLength: 30,
        defaultValue: "Book now",
      },
    ],
  },
  {
    key: "about",
    label: "About",
    description: "Your story: who you are and what makes your work different.",
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "About us", maxLength: 80 },
      {
        key: "body",
        label: "Your story",
        type: "textarea",
        placeholder: "e.g. Founded in 2019, we specialise in natural and textured hair…",
        maxLength: 1500,
      },
      { key: "image", label: "Photo", type: "image" },
    ],
  },
  {
    key: "services",
    label: "Services",
    description: "Your price list. Add the services themselves on the Services page.",
    managedBy: { label: "Edit services and prices", href: "/dashboard/services" },
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Services & prices", maxLength: 80 },
      {
        key: "intro",
        label: "Intro",
        type: "textarea",
        placeholder: "e.g. All prices include a consultation and finish.",
        maxLength: 400,
      },
    ],
  },
  {
    key: "team",
    label: "Team",
    description: "Your stylists and therapists. Add people on the Team page.",
    managedBy: { label: "Edit team members", href: "/dashboard/team" },
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Meet the team", maxLength: 80 },
      { key: "intro", label: "Intro", type: "textarea", maxLength: 400 },
    ],
  },
  {
    key: "gallery",
    label: "Gallery",
    description: "Photos of your work and your space.",
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Our work", maxLength: 80 },
      {
        key: "images",
        label: "Photos",
        type: "list",
        itemLabel: "Photo",
        maxItems: 24,
        itemFields: [
          { key: "image", label: "Photo", type: "image" },
          { key: "caption", label: "Caption", type: "text", maxLength: 120 },
        ],
      },
    ],
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "What clients say about you.",
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Kind words", maxLength: 80 },
      {
        key: "items",
        label: "Reviews",
        type: "list",
        itemLabel: "Review",
        maxItems: 12,
        itemFields: [
          { key: "quote", label: "Review", type: "textarea", maxLength: 600 },
          { key: "name", label: "Client name", type: "text", placeholder: "e.g. Amara O.", maxLength: 60 },
          {
            key: "source",
            label: "Where it was left",
            type: "text",
            placeholder: "e.g. Google",
            maxLength: 40,
          },
          {
            key: "rating",
            label: "Star rating",
            type: "select",
            description: "Only add stars the client actually gave.",
            options: REVIEW_RATING_OPTIONS,
            defaultValue: "none",
          },
        ],
      },
    ],
  },
  {
    key: "faqs",
    label: "FAQs",
    description: "Answers to the questions clients always ask.",
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Good to know", maxLength: 80 },
      {
        key: "items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        maxItems: 20,
        itemFields: [
          { key: "question", label: "Question", type: "text", maxLength: 200 },
          { key: "answer", label: "Answer", type: "textarea", maxLength: 1000 },
        ],
      },
    ],
  },
  {
    key: "visit",
    label: "Opening hours & location",
    description:
      "Your hours and address. Set hours on the Opening hours page and your address in Business details.",
    managedBy: { label: "Edit opening hours", href: "/dashboard/hours" },
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Visit us", maxLength: 80 },
      {
        key: "directions",
        label: "Getting here",
        type: "textarea",
        placeholder: "e.g. Two minutes from the station. Free parking at the rear.",
        maxLength: 500,
      },
      { key: "showMap", label: "Show a map", type: "toggle", defaultValue: true },
    ],
  },
  {
    key: "contact",
    label: "Contact & socials",
    description: "How clients reach you, and your social links.",
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Get in touch", maxLength: 80 },
      { key: "intro", label: "Intro", type: "textarea", maxLength: 400 },
      {
        key: "showForm",
        label: "Show a message form",
        type: "toggle",
        description: "Messages appear in your dashboard.",
        defaultValue: true,
      },
      { key: "instagram", label: "Instagram link", type: "url", placeholder: "https://instagram.com/…" },
      { key: "tiktok", label: "TikTok link", type: "url", placeholder: "https://tiktok.com/@…" },
      { key: "facebook", label: "Facebook link", type: "url", placeholder: "https://facebook.com/…" },
      {
        key: "whatsapp",
        label: "WhatsApp number",
        type: "text",
        placeholder: "e.g. +44 7700 900123",
        maxLength: 30,
      },
    ],
  },
  {
    key: "booking",
    label: "Booking banner",
    description:
      "A call to action near the bottom of the page. Where the Book buttons go is set on the Booking page.",
    managedBy: { label: "Booking settings", href: "/dashboard/booking" },
    fields: [
      SHOW,
      { key: "heading", label: "Heading", type: "text", placeholder: "Ready for your next appointment?", maxLength: 80 },
      { key: "body", label: "Text", type: "textarea", maxLength: 300 },
      { key: "ctaLabel", label: "Button text", type: "text", placeholder: "Book now", maxLength: 30, defaultValue: "Book now" },
    ],
  },
  {
    key: "seo",
    label: "Search & sharing",
    description: "How your site appears on Google and when shared on WhatsApp or Instagram.",
    alwaysOn: true,
    fields: [
      {
        key: "title",
        label: "Page title",
        type: "text",
        description: "Leave empty to use your business name.",
        maxLength: 70,
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "e.g. Award-winning hair salon in Crouch End, London.",
        maxLength: 160,
      },
      { key: "shareImage", label: "Sharing image", type: "image", description: "Shown in link previews." },
    ],
  },
];

export const SECTION_KEYS = SITE_SECTIONS.map((section) => section.key);

export function getSection(key: SectionKey): SectionDefinition {
  const section = SITE_SECTIONS.find((item) => item.key === key);
  if (!section) throw new Error(`Unknown site section: ${key}`);
  return section;
}

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && (SECTION_KEYS as string[]).includes(value);
}

function isListField(field: ContentField): field is ListField {
  return field.type === "list";
}

function clampText(value: string, field: ScalarField): string {
  const trimmed = value.trim();
  return field.maxLength ? trimmed.slice(0, field.maxLength) : trimmed;
}

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/** Clean one scalar value against its field; unknown or invalid values are dropped. */
function parseScalar(field: ScalarField, raw: unknown): string | boolean | undefined {
  switch (field.type) {
    case "toggle":
      if (typeof raw === "boolean") return raw;
      if (raw === "true") return true;
      if (raw === "false") return false;
      return undefined;
    case "color":
      return typeof raw === "string" && COLOR_PATTERN.test(raw.trim()) ? raw.trim().toLowerCase() : undefined;
    case "select":
      return typeof raw === "string" && field.options?.some((option) => option.value === raw) ? raw : undefined;
    case "url": {
      if (typeof raw !== "string") return undefined;
      const value = clampText(raw, field);
      if (!value) return "";
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    }
    case "image":
      return typeof raw === "string" && (raw.trim() === "" || /^https:\/\//i.test(raw.trim()))
        ? raw.trim()
        : undefined;
    default:
      return typeof raw === "string" ? clampText(raw, field) : undefined;
  }
}

function parseListItem(field: ListField, raw: unknown): ListItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item: ListItem = {};
  for (const itemField of field.itemFields) {
    const value = parseScalar(itemField, (raw as Record<string, unknown>)[itemField.key]);
    item[itemField.key] = typeof value === "string" ? value : "";
  }
  return Object.values(item).some((value) => value) ? item : null;
}

/** Parse one section's values, keeping only declared fields. */
export function parseSectionValues(key: SectionKey, raw: unknown): SectionValues {
  const section = getSection(key);
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: SectionValues = {};
  for (const field of section.fields) {
    if (isListField(field)) {
      const items = Array.isArray(source[field.key]) ? (source[field.key] as unknown[]) : [];
      out[field.key] = items
        .map((item) => parseListItem(field, item))
        .filter((item): item is ListItem => item != null)
        .slice(0, field.maxItems);
      continue;
    }
    const value = parseScalar(field, source[field.key]);
    if (value !== undefined) out[field.key] = value;
  }
  return out;
}

/** Parse stored content (jsonb) into a clean SiteContent. Safe on any input. */
export function parseSiteContent(raw: unknown): SiteContent {
  let record: unknown = raw;
  if (typeof raw === "string") {
    try {
      record = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) return {};
  const out: SiteContent = {};
  for (const key of SECTION_KEYS) {
    const value = (record as Record<string, unknown>)[key];
    if (value !== undefined) out[key] = parseSectionValues(key, value);
  }
  return out;
}

function findScalarField(section: SectionDefinition, fieldKey: string): ScalarField | undefined {
  const field = section.fields.find((item) => item.key === fieldKey);
  return field && !isListField(field) ? field : undefined;
}

/** A text value with the field's default, then `fallback`, when empty. */
export function sectionText(content: SiteContent, key: SectionKey, fieldKey: string, fallback = ""): string {
  const value = content[key]?.[fieldKey];
  if (typeof value === "string" && value.trim()) return value;
  const field = findScalarField(getSection(key), fieldKey);
  return typeof field?.defaultValue === "string" ? field.defaultValue : fallback;
}

export function sectionFlag(content: SiteContent, key: SectionKey, fieldKey: string): boolean {
  const value = content[key]?.[fieldKey];
  if (typeof value === "boolean") return value;
  const field = findScalarField(getSection(key), fieldKey);
  return field?.defaultValue === true;
}

export function sectionItems(content: SiteContent, key: SectionKey, fieldKey: string): ListItem[] {
  const value = content[key]?.[fieldKey];
  return Array.isArray(value) ? value : [];
}

/** The owner hasn't switched the section off. Template support is checked separately. */
export function isSectionEnabled(content: SiteContent, key: SectionKey): boolean {
  if (getSection(key).alwaysOn) return true;
  return sectionFlag(content, key, "show");
}
