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

/** CSS variables a template can use for the owner's brand colours and fonts. */
export function brandStyle(business: Business): React.CSSProperties {
  const content = business.content;
  const fonts = FONT_STACKS[sectionText(content, "brand", "font", "elegant")] ?? FONT_STACKS.elegant;
  return {
    "--brand": sectionText(content, "brand", "primaryColor", "#1f1a17"),
    "--accent": sectionText(content, "brand", "accentColor", "#f3ebe4"),
    "--font-heading": fonts.heading,
    "--font-copy": fonts.body,
  } as React.CSSProperties;
}

/** Google Maps embed for an address, without an API key. */
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
