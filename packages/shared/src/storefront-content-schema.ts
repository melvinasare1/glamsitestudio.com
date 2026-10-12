import type { StorefrontTemplate } from "./types";

export type StorefrontContentScalarType = "text" | "textarea" | "image";
export type StorefrontContentFieldType = StorefrontContentScalarType | "repeatable";

export type StorefrontContentItemField = {
  key: string;
  label: string;
  description?: string;
  type: StorefrontContentScalarType;
  placeholder: string;
};

export type StorefrontContentScalarField = {
  key: string;
  label: string;
  description?: string;
  type: StorefrontContentScalarType;
  placeholder: string;
  page: string;
};

export type StorefrontContentRepeatableField = {
  key: string;
  label: string;
  description?: string;
  type: "repeatable";
  page: string;
  itemLabel: string;
  itemFields: StorefrontContentItemField[];
};

export type StorefrontContentField = StorefrontContentScalarField | StorefrontContentRepeatableField;

/** One row in a repeatable field (all sub-values are strings, including image URLs). */
export type StorefrontRepeatableItem = Record<string, string>;

/** Seller-editable copy, image URLs, and repeatable lists, keyed by template field `key`. */
export type StorefrontContentValue = string | StorefrontRepeatableItem[];
export type StorefrontContent = Record<string, StorefrontContentValue>;

export function isRepeatableField(
  field: StorefrontContentField
): field is StorefrontContentRepeatableField {
  return field.type === "repeatable";
}

function textField(
  key: string,
  label: string,
  placeholder: string,
  page: string,
  description?: string
): StorefrontContentScalarField {
  return { key, label, description, type: "text", placeholder, page };
}

function textareaField(
  key: string,
  label: string,
  placeholder: string,
  page: string,
  description?: string
): StorefrontContentScalarField {
  return { key, label, description, type: "textarea", placeholder, page };
}

function imageField(
  key: string,
  label: string,
  placeholder: string,
  page: string,
  description?: string
): StorefrontContentScalarField {
  return { key, label, description, type: "image", placeholder, page };
}

function itemText(
  key: string,
  label: string,
  placeholder: string,
  description?: string
): StorefrontContentItemField {
  return { key, label, description, type: "text", placeholder };
}

function itemTextarea(
  key: string,
  label: string,
  placeholder: string,
  description?: string
): StorefrontContentItemField {
  return { key, label, description, type: "textarea", placeholder };
}

function itemImage(
  key: string,
  label: string,
  placeholder: string,
  description?: string
): StorefrontContentItemField {
  return { key, label, description, type: "image", placeholder };
}

/**
 * Editable storefront fields per template. The dashboard editor renders
 * from this list, grouped by each field's `page`. Adding sneaker/kitchenware
 * (or a new page like `checkout`) is another entry here, not new form code.
 */
export const STOREFRONT_CONTENT_SCHEMA: Partial<
  Record<StorefrontTemplate, StorefrontContentField[]>
> = {
  "template-a": [
    {
      key: "heroHeadline",
      label: "Main headline",
      description: "The large title at the top of your shop homepage.",
      type: "text",
      placeholder: "e.g. Men's Clothing",
      page: "home",
    },
    {
      key: "heroSubtext",
      label: "Line under the headline",
      description: "The supporting sentence shown directly beneath your main headline.",
      type: "textarea",
      placeholder: "e.g. New season pieces, made to last.",
      page: "home",
    },
    {
      key: "heroImageUrl",
      label: "Top banner photo",
      description: "The wide photo visitors see behind or above your headline.",
      type: "image",
      placeholder: "Upload a wide photo for the top of your shop",
      page: "home",
    },
    {
      key: "aboutText",
      label: "About your shop",
      description: "A short story about your brand, shown on the homepage.",
      type: "textarea",
      placeholder: "e.g. A short story about your brand.",
      page: "home",
    },
    {
      key: "logoUrl",
      label: "Shop logo",
      description: "Your logo in the shop header.",
      type: "image",
      placeholder: "Upload your logo",
      page: "home",
    },
  ],
  "sneaker-template": [
    textareaField(
      "heroHeadline",
      "Main headline",
      "e.g. Sneakers That Defy Your Everyday Look",
      "home",
      "The large title over the homepage hero photo."
    ),
    textareaField(
      "heroSubtext",
      "Line under the headline",
      "e.g. New drops, everyday pairs, and accessories…",
      "home",
      "The supporting sentence shown directly beneath your main headline."
    ),
    imageField(
      "heroImageUrl",
      "Hero photo",
      "Upload a wide lifestyle photo for the top of your shop",
      "home",
      "The full-width photo behind your headline. Leave empty to use the placeholder."
    ),
  ],
  "kitchenware-template": [
    textareaField(
      "heroHeadline",
      "Main headline",
      "e.g. Eco-Friendly Kitchenware for a greener home",
      "home",
      "The large title at the top of your shop homepage."
    ),
    textareaField(
      "heroSubtext",
      "Line under the headline",
      "e.g. Thoughtfully made tools for everyday cooking…",
      "home",
      "The supporting sentence shown directly beneath your main headline."
    ),
  ],
  "hair-beauty-template": [
    textField(
      "heroHeadline",
      "Main headline",
      "e.g. Luxury Hair Crafted For Every Crown",
      "home",
      "The large title at the top of your shop homepage."
    ),
    textareaField(
      "heroSubtext",
      "Line under the headline",
      "e.g. Premium quality wigs and bundles designed to elevate your natural beauty.",
      "home",
      "The supporting sentence shown directly beneath your main headline."
    ),
    imageField(
      "heroImageUrl",
      "Top banner photo",
      "Upload a wide photo for the top of your shop",
      "home",
      "The wide photo visitors see on your homepage hero. Leave empty to use the default."
    ),
    imageField(
      "logoUrl",
      "Shop logo",
      "Upload your logo",
      "home",
      "Your logo in the shop header."
    ),
  ],
  "imports-template": [
    textField(
      "heroHeadline",
      "Main headline",
      "e.g. Quality imports, delivered to your door",
      "home",
      "The large title at the top of your shop homepage."
    ),
    textareaField(
      "heroSubtext",
      "Line under the headline",
      "e.g. Everyday imported goods for Ghanaian homes…",
      "home",
      "The supporting sentence shown directly beneath your main headline."
    ),
    imageField(
      "heroImageUrl",
      "Top banner photo",
      "Upload a wide photo for the top of your shop",
      "home",
      "The wide photo visitors see behind your headline. Leave empty to use the default blue banner."
    ),
    imageField(
      "logoUrl",
      "Shop logo",
      "Upload your logo",
      "home",
      "Your logo in the shop header."
    ),
    textField(
      "contactKicker",
      "Contact page label",
      "e.g. Get in touch",
      "contact",
      "The small text above the contact page headline."
    ),
    textField(
      "contactHeadline",
      "Contact page headline",
      "e.g. Contact us",
      "contact",
      "The main title on your contact page."
    ),
    textareaField(
      "contactSubtext",
      "Contact page intro",
      "Use {brandName} for your shop name. e.g. Questions about an order? Message {brandName}.",
      "contact",
      "The paragraph under the headline. Use {brandName} where your shop name should appear."
    ),
    textField(
      "contactFormHeading",
      "Message form title",
      "e.g. Send a message",
      "contact",
      "The heading above the contact form."
    ),
    textareaField(
      "contactFormIntro",
      "Message form intro",
      "e.g. Tell us what you need…",
      "contact",
      "Short instructions above the contact form fields."
    ),
    textField(
      "contactWhatsappHeading",
      "WhatsApp section title",
      "e.g. Call or WhatsApp",
      "contact",
      "The heading above your WhatsApp / phone details."
    ),
    textareaField(
      "contactWhatsappBody",
      "WhatsApp section text",
      "Use {brandName} for your shop name.",
      "contact",
      "Text beside your phone number. Use {brandName} where your shop name should appear."
    ),
  ],
  "motorbike-template": [
    imageField(
      "logoUrl",
      "Shop logo",
      "Upload your logo",
      "header",
      "Shown in the top bar and footer of every page."
    ),

    textareaField(
      "heroHeadline",
      "Main headline",
      "e.g. Ride Better.\nRide Together.",
      "hero",
      "The big title at the very top of your homepage."
    ),
    textareaField(
      "heroSubtext",
      "Line under the headline",
      "e.g. Motorbikes, bicycles, mopeds, and scooters…",
      "hero",
      "The paragraph directly beneath your main headline."
    ),
    imageField(
      "heroImage",
      "Top banner photo",
      "Upload a wide photo",
      "hero",
      "The large photo in the hero section at the top of your shop."
    ),

    {
      key: "trustBadges",
      label: "Trust badges strip",
      description: "Short labels in the row below your hero (e.g. warranty, delivery).",
      type: "repeatable",
      page: "trust-strip",
      itemLabel: "Badge",
      itemFields: [itemText("label", "Badge text", "e.g. Warranty", "What the badge says")],
    },

    textField("shopHeading", "Shop section title", "e.g. Shop", "shop", "The heading above your category cards."),
    {
      key: "shopCategories",
      label: "Category cards",
      description: "The image tiles shoppers click to browse product types.",
      type: "repeatable",
      page: "shop",
      itemLabel: "Category",
      itemFields: [
        itemText("label", "Category name", "e.g. Motorbikes", "The name shown on the card"),
        itemImage("image", "Card photo", "Upload category photo", "Photo on the category tile"),
        itemText(
          "linkCategory",
          "Product filter",
          "e.g. motorbikes",
          "Matches products in this category (optional)"
        ),
      ],
    },

    textField(
      "promoHeadline",
      "Featured product name",
      "e.g. Apex R9",
      "promo",
      "The bold product name in the promo banner."
    ),
    textField(
      "promoKicker",
      "Featured product type",
      "e.g. Street Motorbike",
      "promo",
      "The small label above the product name."
    ),
    textareaField(
      "promoBody",
      "Featured product description",
      "e.g. Street-ready motorbike with a punchy engine…",
      "promo",
      "The short description beside the featured product photo."
    ),
    imageField(
      "promoImage",
      "Featured product photo",
      "Upload product photo",
      "promo",
      "The photo in the promo banner."
    ),

    {
      key: "featureStrip",
      label: "Three selling points",
      description: "The three columns with icons below the promo banner.",
      type: "repeatable",
      page: "features",
      itemLabel: "Column",
      itemFields: [
        itemText("label", "Column title", "e.g. Trusted Brands", "The bold heading"),
        itemTextarea("body", "Column text", "Short supporting sentence", "One or two sentences below the title"),
      ],
    },

    textField(
      "accessoriesHeading",
      "Accessories section title",
      "e.g. Gear & Accessories",
      "accessories",
      "The heading above the accessories product row."
    ),
    {
      key: "accessories",
      label: "Accessory products",
      description: "Products shown in the accessories carousel.",
      type: "repeatable",
      page: "accessories",
      itemLabel: "Product",
      itemFields: [
        itemText("name", "Product name", "e.g. Motorbike Helmet", "Shown on the product card"),
        itemImage("image", "Product photo", "Upload product photo", "Photo on the card"),
        itemText("price", "Price (GHS)", "e.g. 450", "Displayed on the card"),
        itemText(
          "productId",
          "Link to listing",
          "Optional product id",
          "Connects this card to a real product page (optional)"
        ),
      ],
    },

    {
      key: "valueProps",
      label: "Why shop with you",
      description: "Three columns explaining delivery, support, or other benefits.",
      type: "repeatable",
      page: "value-props",
      itemLabel: "Benefit",
      itemFields: [
        itemText("label", "Benefit title", "e.g. Delivery Across Accra", "The bold heading"),
        itemTextarea("body", "Benefit text", "Short supporting sentence", "One or two sentences below the title"),
      ],
    },

    textField(
      "darkBannerHeadline",
      "Dark banner headline",
      "e.g. E-Bike",
      "dark-banner",
      "The large title on the dark feature banner."
    ),
    textareaField(
      "darkBannerBody",
      "Dark banner text",
      "e.g. Quiet power for city hops and weekend loops…",
      "dark-banner",
      "The description on the dark feature banner."
    ),
    imageField(
      "darkBannerImage",
      "Dark banner photo",
      "Upload banner photo",
      "dark-banner",
      "The photo on the dark feature banner."
    ),
    textField(
      "darkBannerCalloutTitle",
      "Callout box title",
      "e.g. Super Powerful Battery",
      "dark-banner",
      "The bold line inside the small callout box."
    ),
    textareaField(
      "darkBannerCalloutBody",
      "Callout box text",
      "e.g. The best range ever seen for a bike like this.",
      "dark-banner",
      "Supporting text inside the callout box."
    ),

    textField(
      "blogHeading",
      "Blog section title",
      "e.g. Recent Blog Posts",
      "blog",
      "The heading above your blog cards."
    ),
    {
      key: "blogPosts",
      label: "Blog cards",
      description: "Preview cards for blog posts on your homepage.",
      type: "repeatable",
      page: "blog",
      itemLabel: "Post",
      itemFields: [
        itemText("title", "Post title", "Post title", "The headline on the card"),
        itemTextarea("excerpt", "Short summary", "One or two sentences", "Shown beneath the title"),
        itemImage("image", "Card photo", "Upload card photo", "Photo on the blog card"),
        itemText("date", "Date shown", "e.g. 30 Aug 2026", "Displayed on the card"),
        itemText("href", "Link (optional)", "https://…", "Where the card links to"),
      ],
    },

    textareaField(
      "footerTagline",
      "Footer tagline",
      "e.g. Motorbikes, bicycles, mopeds, and scooters…",
      "footer",
      "The short line under your logo in the footer."
    ),
    textField(
      "footerNewsletterHeading",
      "Newsletter heading",
      "e.g. Signup for latest information",
      "footer",
      "The title above the email signup box in the footer."
    ),
    {
      key: "footerSocialLinks",
      label: "Social media links",
      description: "Icons and links in the footer.",
      type: "repeatable",
      page: "footer",
      itemLabel: "Link",
      itemFields: [
        itemText("network", "Platform name", "e.g. Instagram", "Which social network"),
        itemText("url", "Profile URL", "https://…", "Full link to your profile"),
      ],
    },

    textField(
      "contactKicker",
      "Contact page label",
      "e.g. Get in touch",
      "contact",
      "The small text above the contact page headline."
    ),
    textField(
      "contactHeadline",
      "Contact page headline",
      "e.g. Contact Us",
      "contact",
      "The main title on your contact page."
    ),
    textareaField(
      "contactSubtext",
      "Contact page intro",
      "Use {brandName} for your shop name. e.g. Call {brandName} directly.",
      "contact",
      "The paragraph under the headline. Use {brandName} where your shop name should appear."
    ),
    textField(
      "contactFormHeading",
      "Message form title",
      "e.g. Send a message",
      "contact",
      "The heading above the contact form."
    ),
    textareaField(
      "contactFormIntro",
      "Message form intro",
      "e.g. Tell us what you're looking for…",
      "contact",
      "Short instructions above the contact form fields."
    ),
    textField(
      "contactWhatsappHeading",
      "WhatsApp section title",
      "e.g. Call or WhatsApp",
      "contact",
      "The heading above your WhatsApp / phone details."
    ),
    textareaField(
      "contactWhatsappBody",
      "WhatsApp section text",
      "Use {brandName} for your shop name.",
      "contact",
      "Text beside your phone number. Use {brandName} where your shop name should appear."
    ),
  ],
};

/**
 * Pages that appear as editor tabs for each template, including pages
 * with no fields yet. Field `page` values are also included automatically.
 */
export const STOREFRONT_CONTENT_PAGES: Partial<Record<StorefrontTemplate, readonly string[]>> = {
  "template-a": ["home", "product", "cart"],
  "sneaker-template": ["home", "product", "cart"],
  "kitchenware-template": ["home", "product", "cart"],
  "imports-template": ["home", "product", "cart", "contact"],
  "hair-beauty-template": ["home", "product", "cart", "contact"],
  "motorbike-template": [
    "header",
    "hero",
    "trust-strip",
    "shop",
    "promo",
    "features",
    "accessories",
    "value-props",
    "dark-banner",
    "blog",
    "footer",
    "contact",
  ],
};

export function getStorefrontContentFields(
  template: StorefrontTemplate,
  page?: string
): StorefrontContentField[] {
  const fields = STOREFRONT_CONTENT_SCHEMA[template] ?? [];
  return page ? fields.filter((field) => field.page === page) : fields;
}

/** Editor tabs for a template: declared pages plus any page ids found on fields. */
export function getStorefrontEditorPages(template: StorefrontTemplate): string[] {
  const seen = new Set<string>();
  const pages: string[] = [];
  for (const page of [
    ...(STOREFRONT_CONTENT_PAGES[template] ?? []),
    ...getStorefrontContentFields(template).map((field) => field.page),
  ]) {
    if (!page || seen.has(page)) continue;
    seen.add(page);
    pages.push(page);
  }
  return pages;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  product: "Product",
  cart: "Cart",
  header: "Header",
  hero: "Hero",
  "trust-strip": "Trust Strip",
  shop: "Shop Categories",
  promo: "Promo Banner",
  features: "Features Strip",
  accessories: "Accessories",
  "value-props": "Value Props",
  "dark-banner": "Dark Feature Banner",
  blog: "Blog",
  footer: "Footer",
  contact: "Contact",
};

export function storefrontPageLabel(page: string): string {
  return PAGE_LABELS[page] ?? page.charAt(0).toUpperCase() + page.slice(1);
}

function parseRepeatableItem(value: unknown): StorefrontRepeatableItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: StorefrontRepeatableItem = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") out[key] = entry;
    else if (typeof entry === "number" || typeof entry === "boolean") out[key] = String(entry);
  }
  return out;
}

export function parseStorefrontContent(value: unknown): StorefrontContent {
  let record: unknown = value;
  if (typeof value === "string") {
    try {
      record = JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) return {};
  const out: StorefrontContent = {};
  for (const [key, entry] of Object.entries(record as Record<string, unknown>)) {
    if (typeof entry === "string") {
      out[key] = entry;
    } else if (typeof entry === "number" || typeof entry === "boolean") {
      out[key] = String(entry);
    } else if (Array.isArray(entry)) {
      out[key] = entry
        .map(parseRepeatableItem)
        .filter((item): item is StorefrontRepeatableItem => item != null);
    }
  }
  return out;
}

export function storefrontContentValue(
  content: StorefrontContent | undefined,
  key: string,
  fallback = ""
): string {
  const value = content?.[key];
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function storefrontContentItems(
  content: StorefrontContent | undefined,
  key: string
): StorefrontRepeatableItem[] {
  const value = content?.[key];
  return Array.isArray(value) ? value : [];
}

export function emptyRepeatableItem(field: StorefrontContentRepeatableField): StorefrontRepeatableItem {
  return Object.fromEntries(field.itemFields.map((item) => [item.key, ""]));
}

function itemHasContent(item: StorefrontRepeatableItem): boolean {
  return Object.values(item).some((value) => value.trim());
}

/** Repeatable rows that have at least one filled sub-field. Empty lists mean “use template fallbacks”. */
export function filledStorefrontContentItems(
  content: StorefrontContent | undefined,
  key: string
): StorefrontRepeatableItem[] {
  return storefrontContentItems(content, key).filter(itemHasContent);
}

function itemForSave(
  field: StorefrontContentRepeatableField,
  raw: StorefrontRepeatableItem
): StorefrontRepeatableItem {
  const out: StorefrontRepeatableItem = {};
  for (const itemField of field.itemFields) {
    const value = raw[itemField.key];
    out[itemField.key] = typeof value === "string" ? value.trim() : "";
  }
  return out;
}

/** Keep only keys declared for this template. */
export function storefrontContentForSave(
  fields: StorefrontContentField[],
  values: StorefrontContent
): StorefrontContent {
  const out: StorefrontContent = {};
  for (const field of fields) {
    if (isRepeatableField(field)) {
      const raw = values[field.key];
      const items = Array.isArray(raw) ? raw : [];
      out[field.key] = items.map((item) => itemForSave(field, item));
      continue;
    }
    const value = values[field.key];
    out[field.key] = typeof value === "string" ? value.trim() : "";
  }
  return out;
}
