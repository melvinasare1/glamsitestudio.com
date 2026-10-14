import { sectionText } from "@glamsite/shared/site-content";
import type { Business } from "@glamsite/shared/types";

/** Where every Book button on a site goes. */
export function bookingHref(business: Business): string {
  if (business.bookingMode === "link" && business.bookingUrl.trim()) return business.bookingUrl.trim();
  // Glam Site booking (stage 5) isn't built yet; send visitors to the contact section meanwhile.
  return "#contact";
}

export function opensInNewTab(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function siteTitle(business: Business): string {
  return sectionText(business.content, "seo", "title", business.name);
}

const FONT_STACKS: Record<string, { heading: string; body: string }> = {
  elegant: {
    heading: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  modern: {
    heading: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  soft: {
    heading: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif',
    body: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
  },
};

export type BrandFont = "elegant" | "modern" | "soft";

/** The owner's colours, or the template's own when they haven't picked any. */
export function brandColors(business: Business, defaults: { primary: string; accent: string }) {
  const stored = business.content.brand ?? {};
  const pick = (value: unknown, fallback: string) =>
    typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return { primary: pick(stored.primaryColor, defaults.primary), accent: pick(stored.accentColor, defaults.accent) };
}

export function brandFont(business: Business): BrandFont {
  const value = sectionText(business.content, "brand", "font", "elegant");
  return value === "modern" || value === "soft" ? value : "elegant";
}

/** Dark or light text, whichever reads better on a #rrggbb background. */
export function inkOn(hex: string, dark = "#1f1f1f", light = "#ffffff"): string {
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  // Contrast against white vs against near-black.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0636 ? light : dark;
}

/** CSS variables a template can use for the owner's brand colours and fonts. */
export function brandStyle(business: Business): React.CSSProperties {
  const fonts = FONT_STACKS[brandFont(business)];
  const colors = brandColors(business, { primary: "#1f1a17", accent: "#f3ebe4" });
  return {
    "--brand": colors.primary,
    "--accent": colors.accent,
    "--font-heading": fonts.heading,
    "--font-copy": fonts.body,
  } as React.CSSProperties;
}

/** Rounded font stack for the "soft" brand font, shared by every template. */
export const SOFT_FONT_STACK = FONT_STACKS.soft.heading;

/** Google Maps embed for an address, without an API key. */
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
