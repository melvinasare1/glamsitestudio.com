/* eslint-disable @next/next/no-img-element -- owner photos come from storage at unknown sizes */
import { ArrowRight, Mail, MapPin, MessageCircle, Phone, Plus, Star } from "lucide-react";
import { reviewRating, sectionFlag, sectionItems, sectionText } from "@glamsite/shared/site-content";
import { formatAddress, formatDuration, formatServicePrice, groupServices, hoursByDay } from "@glamsite/shared/format";
import { visibleSections } from "@glamsite/shared/templates";
import type { SiteData } from "@glamsite/shared/types";
import { telHref, whatsappHref } from "@/lib/contact";
import { ContactForm } from "../ContactForm";
import { SOFT_FONT_STACK, bookingHref, brandColors, brandFont, inkOn, mapEmbedUrl, opensInNewTab } from "../shared";
import { luxeSans, luxeSerif } from "./fonts";
import { MobileMenu } from "./MobileMenu";
import { PriceList, type PriceGroup } from "./PriceList";
import { Rail } from "./Rail";

/**
 * Luxe (template 1, hair), single-page size. Premium and warm: espresso,
 * cream and champagne gold, Playfair Display over Montserrat.
 *
 * The owner's main colour drives the dark bands (header, reviews, footer) and
 * their accent colour drives buttons and highlights. Owners who haven't picked
 * colours get the Luxe palette.
 */

const LUXE = { espresso: "#2a1e16", gold: "#d4af7c", cream: "#f8f5ee", beige: "#eadcc8", mocha: "#5b4332", charcoal: "#1f1f1f" };

const container = "mx-auto w-full max-w-[1200px] px-5 md:px-8";
const sectionPad = "py-20 md:py-[120px]";
const h2 = "font-[family-name:var(--lx-heading)] text-[2rem] leading-[1.2] md:text-[2.5rem] md:leading-[3rem]";
const h3 = "font-[family-name:var(--lx-heading)] text-2xl leading-8";

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${
        onDark ? "text-[var(--lx-gold)]" : "text-[var(--lx-muted)]"
      }`}
    >
      {children}
    </p>
  );
}

function BookButton({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  const external = opensInNewTab(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a
      href={href}
      {...external}
      className={`inline-flex items-center gap-2 rounded-full bg-[var(--lx-gold)] px-7 py-3.5 text-base font-medium leading-5 text-[var(--lx-gold-ink)] transition hover:brightness-105 ${className}`}
    >
      {label}
      <ArrowRight className="size-4" aria-hidden />
    </a>
  );
}

/** Secondary action, e.g. "Learn more" in the Luxe style guide. */
function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="mt-8 inline-flex min-h-11 items-center rounded-full border border-[var(--lx-gold)] px-7 py-3 text-base font-medium leading-5 text-[var(--lx-ink)] transition hover:bg-[var(--lx-gold)] hover:text-[var(--lx-gold-ink)]"
    >
      {children}
    </a>
  );
}

/** "Luxe Hair Studio" → LUXE over HAIR STUDIO, like the Luxe wordmark. */
function Wordmark({ name, logo }: { name: string; logo: string }) {
  if (logo) return <img src={logo} alt={name} className="h-11 w-auto" />;
  const [first, ...rest] = name.trim().split(/\s+/);
  return (
    <span className="flex flex-col leading-none">
      <span className="font-[family-name:var(--lx-heading)] text-[1.75rem] uppercase tracking-[0.06em]">{first}</span>
      {rest.length ? (
        <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.42em] opacity-80">{rest.join(" ")}</span>
      ) : null}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <p className="flex gap-0.5 text-[var(--lx-gold)]" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: rating }, (_, index) => (
        <Star key={index} className="size-4 fill-current" aria-hidden />
      ))}
    </p>
  );
}

const SOCIAL_PATHS: Record<string, string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  tiktok:
    "M16.6 2h-3.3v13.2a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .8.1V9.1a6.2 6.2 0 1 0 5.3 6.1V8.6a8 8 0 0 0 4.6 1.5V6.8a4.7 4.7 0 0 1-4.6-4.8Z",
  facebook:
    "M13.5 21.9v-7.4H16l.4-3h-2.9V9.6c0-.8.2-1.4 1.4-1.4h1.6V5.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H8v3h2.4v7.4a10 10 0 1 1 3.1 0Z",
};

function Socials({ links, className = "" }: { links: { key: string; href: string }[]; className?: string }) {
  if (!links.length) return null;
  return (
    <ul className={`flex gap-2 ${className}`}>
      {links.map((link) => (
        <li key={link.key}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.key.charAt(0).toUpperCase() + link.key.slice(1)}
            className="flex size-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,currentColor_25%,transparent)] transition hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
          >
            <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden>
              <path fillRule="evenodd" d={SOCIAL_PATHS[link.key]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function LuxeSite({ data, demo = false }: { data: SiteData; demo?: boolean }) {
  const { business, categories, services, staff, hours } = data;
  const content = business.content;
  const shown = new Set(visibleSections(business.templateId, content));
  const book = bookingHref(business);
  const ctaLabel = sectionText(content, "hero", "ctaLabel");
  const address = formatAddress(business.address);
  const heroImage = sectionText(content, "hero", "image");

  const colors = brandColors(business, { primary: LUXE.espresso, accent: LUXE.gold });
  const font = brandFont(business);
  const style = {
    "--lx-dark": colors.primary,
    "--lx-dark-ink": inkOn(colors.primary, LUXE.charcoal, LUXE.cream),
    "--lx-gold": colors.accent,
    "--lx-gold-ink": inkOn(colors.accent, LUXE.charcoal, "#ffffff"),
    "--lx-cream": LUXE.cream,
    "--lx-beige": LUXE.beige,
    "--lx-ink": LUXE.charcoal,
    "--lx-muted": LUXE.mocha,
    "--lx-line": "rgba(91, 67, 50, 0.18)",
    "--lx-heading":
      font === "modern" ? "var(--lx-font-sans)" : font === "soft" ? SOFT_FONT_STACK : "var(--lx-font-serif)",
    "--lx-body": "var(--lx-font-sans)",
    // The shared contact form reads these.
    "--brand": colors.primary,
    "--accent": LUXE.beige,
  } as React.CSSProperties;

  // Content for each block, worked out once.
  const aboutBody = sectionText(content, "about", "body");
  const aboutImage = sectionText(content, "about", "image");
  const showAbout = shown.has("about") && Boolean(aboutBody || aboutImage);

  const priceGroups: PriceGroup[] = groupServices(categories, services)
    .filter((group) => group.services.length)
    .map((group) => ({
      id: group.category?.id ?? "other",
      name: group.category?.name ?? "Other",
      rows: group.services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: formatDuration(service.durationMinutes),
        price: formatServicePrice(service, business.currency),
      })),
    }));
  const showPrices = shown.has("services") && priceGroups.length > 0;
  const showTeam = shown.has("team") && staff.length > 0;
  const galleryImages = sectionItems(content, "gallery", "images").filter((item) => item.image);
  const showGallery = shown.has("gallery") && galleryImages.length > 0;
  const reviews = sectionItems(content, "reviews", "items").filter((item) => item.quote);
  const showReviews = shown.has("reviews") && reviews.length > 0;
  const faqs = sectionItems(content, "faqs", "items").filter((item) => item.question);
  const showFaqs = shown.has("faqs") && faqs.length > 0;

  const showContact = shown.has("contact");
  const showVisit = shown.has("visit") && (hours.length > 0 || Boolean(address));
  const phoneHref = business.phone ? telHref(business.phone) : null;
  const whatsapp = sectionText(content, "contact", "whatsapp");
  const waHref = whatsapp ? whatsappHref(whatsapp, business.address.country) : null;
  const socials = (["instagram", "tiktok", "facebook"] as const)
    .map((key) => ({ key, href: sectionText(content, "contact", key) }))
    .filter((item) => item.href);

  const nav = [
    showAbout && { href: "#about", label: "About" },
    showPrices && { href: "#prices", label: "Prices" },
    showGallery && { href: "#gallery", label: "Gallery" },
    (showContact || showVisit) && { href: "#contact", label: "Contact" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <div
      style={style}
      className={`${luxeSerif.variable} ${luxeSans.variable} min-h-screen bg-[var(--lx-cream)] font-[family-name:var(--lx-body)] text-base leading-[26px] text-[var(--lx-ink)]`}
    >
      <header className="sticky top-0 z-40 bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]">
        <div className={`${container} relative flex h-20 items-center justify-between gap-6`}>
          <a href="#top" aria-label={`${business.name} home`}>
            <Wordmark name={business.name} logo={sectionText(content, "brand", "logo")} />
          </a>
          <nav aria-label="Main" className="hidden items-center gap-10 text-sm md:flex">
            {nav.map((link) => (
              <a key={link.href} href={link.href} className="opacity-85 transition hover:opacity-100">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <BookButton href={book} label={ctaLabel} className="!px-5 !py-2.5 text-sm max-md:hidden" />
            <MobileMenu links={nav} />
          </div>
        </div>
      </header>

      <main id="top">
        {shown.has("hero") ? (
          <section className="relative isolate overflow-hidden bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]">
            {heroImage ? (
              <>
                <img
                  src={heroImage}
                  alt=""
                  className="absolute inset-0 -z-10 h-full w-full object-cover object-[72%_center]"
                />
                {/* Keeps the headline readable over any owner photo. */}
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(18,12,8,0.92)_0%,rgba(18,12,8,0.55)_45%,rgba(18,12,8,0.15)_75%)] md:bg-[linear-gradient(to_right,rgba(18,12,8,0.9)_0%,rgba(18,12,8,0.6)_38%,rgba(18,12,8,0)_68%)]"
                />
              </>
            ) : null}
            <div
              className={`${container} flex min-h-[600px] flex-col justify-end pb-14 pt-40 md:min-h-[640px] md:justify-center md:py-28 ${
                heroImage ? "text-[#f8f5ee]" : ""
              }`}
            >
              <div className="max-w-[34rem]">
                {sectionText(content, "hero", "tagline") ? (
                  <Eyebrow onDark>{sectionText(content, "hero", "tagline")}</Eyebrow>
                ) : null}
                <h1 className="font-[family-name:var(--lx-heading)] text-[2.75rem] leading-[1.1] md:text-[4rem] md:leading-[4.5rem]">
                  {sectionText(content, "hero", "headline", business.name)}
                </h1>
                {sectionText(content, "hero", "subheadline") ? (
                  <p className="mt-5 max-w-md text-base leading-[26px] opacity-90 md:text-lg">
                    {sectionText(content, "hero", "subheadline")}
                  </p>
                ) : null}
                <BookButton href={book} label={ctaLabel} className="mt-8" />
              </div>
            </div>
          </section>
        ) : null}

        {showAbout ? (
          <section id="about" className={`${sectionPad} scroll-mt-20`}>
            <div className={`${container} grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16 lg:gap-24`}>
              <div className="max-w-xl">
                <Eyebrow>About us</Eyebrow>
                <h2 className={h2}>{sectionText(content, "about", "heading", "About us")}</h2>
                {aboutBody ? <p className="mt-6 whitespace-pre-line text-[var(--lx-muted)]">{aboutBody}</p> : null}
                {showPrices ? <OutlineButton href="#prices">View our services</OutlineButton> : null}
              </div>
              {aboutImage ? (
                <img src={aboutImage} alt="" className="aspect-[3/2] w-full rounded-xl object-cover shadow-[0_24px_48px_-28px_rgba(42,30,22,0.55)]" />
              ) : null}
            </div>
          </section>
        ) : null}

        {showPrices ? (
          <section id="prices" className={`${sectionPad} scroll-mt-20 bg-white/50`}>
            <div className={container}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <Eyebrow>Our services</Eyebrow>
                  <h2 className={h2}>{sectionText(content, "services", "heading", "Price list")}</h2>
                  {sectionText(content, "services", "intro") ? (
                    <p className="mt-4 max-w-xl text-[var(--lx-muted)]">{sectionText(content, "services", "intro")}</p>
                  ) : null}
                </div>
              </div>
              <PriceList groups={priceGroups} />
            </div>
          </section>
        ) : null}

        {showTeam ? (
          <section className={sectionPad}>
            <div className={container}>
              <Eyebrow>The team</Eyebrow>
              <h2 className={h2}>{sectionText(content, "team", "heading", "Meet the team")}</h2>
              {sectionText(content, "team", "intro") ? (
                <p className="mt-4 max-w-xl text-[var(--lx-muted)]">{sectionText(content, "team", "intro")}</p>
              ) : null}
              <div className="mt-10">
                <Rail label="Team members">
                  {staff.map((person) => (
                    <li
                      key={person.id}
                      className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                    >
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt={person.name} className="aspect-[4/5] w-full rounded-xl object-cover" />
                      ) : (
                        <div
                          aria-hidden
                          className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-[var(--lx-beige)] font-[family-name:var(--lx-heading)] text-7xl text-[var(--lx-muted)]"
                        >
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <h3 className={`${h3} mt-5`}>{person.name}</h3>
                      {person.role ? (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lx-muted)]">
                          {person.role}
                        </p>
                      ) : null}
                      {person.bio ? <p className="mt-3 text-sm leading-[22px] text-[var(--lx-muted)]">{person.bio}</p> : null}
                    </li>
                  ))}
                </Rail>
              </div>
            </div>
          </section>
        ) : null}

        {showGallery ? (
          <section id="gallery" className={`${sectionPad} scroll-mt-20 pt-0 md:pt-0`}>
            <div className={container}>
              <Eyebrow>Gallery</Eyebrow>
              <h2 className={h2}>{sectionText(content, "gallery", "heading", "Our work")}</h2>
              <div className="mt-10">
                <Rail label="Photos of our work">
                  {galleryImages.map((item, index) => (
                    <li
                      key={`${item.image}-${index}`}
                      className="w-[70%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]"
                    >
                      <img src={item.image} alt={item.caption || ""} className="aspect-[4/5] w-full rounded-xl object-cover" />
                      {item.caption ? <p className="mt-3 text-sm text-[var(--lx-muted)]">{item.caption}</p> : null}
                    </li>
                  ))}
                </Rail>
              </div>
            </div>
          </section>
        ) : null}

        {showReviews ? (
          <section className={`${sectionPad} bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]`}>
            <div className={container}>
              <Eyebrow onDark>What our clients say</Eyebrow>
              <h2 className={h2}>{sectionText(content, "reviews", "heading", "Kind words")}</h2>
              <div className="mt-10">
                <Rail label="Client reviews">
                  {reviews.map((item, index) => {
                    const rating = reviewRating(item);
                    return (
                      <li
                        key={index}
                        className="flex w-[85%] shrink-0 snap-start flex-col rounded-xl bg-[var(--lx-cream)] p-7 text-[var(--lx-ink)] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                      >
                        {rating ? <Stars rating={rating} /> : null}
                        <blockquote className="mt-4 flex-1 font-[family-name:var(--lx-heading)] text-lg leading-7">
                          &ldquo;{item.quote}&rdquo;
                        </blockquote>
                        {item.name || item.source ? (
                          <p className="mt-6 text-sm">
                            {item.name ? <span className="font-semibold">{item.name}</span> : null}
                            {item.source ? <span className="block text-[var(--lx-muted)]">{item.source}</span> : null}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </Rail>
              </div>
            </div>
          </section>
        ) : null}

        {showFaqs ? (
          <section className={sectionPad}>
            <div className={`${container} max-w-[900px]`}>
              <Eyebrow>Frequently asked questions</Eyebrow>
              <h2 className={h2}>{sectionText(content, "faqs", "heading", "Good to know")}</h2>
              <div className="mt-10 border-t border-[var(--lx-line)]">
                {faqs.map((item, index) => (
                  <details key={index} className="group border-b border-[var(--lx-line)]">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 font-medium [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <Plus className="size-5 shrink-0 text-[var(--lx-muted)] transition group-open:rotate-45" aria-hidden />
                    </summary>
                    <p className="-mt-1 max-w-2xl whitespace-pre-line pb-6 text-[var(--lx-muted)]">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showContact || showVisit ? (
          <section id="contact" className={`${sectionPad} scroll-mt-20 bg-white/50`}>
            <div className={container}>
              <Eyebrow>Contact &amp; visit</Eyebrow>
              <h2 className={h2}>{sectionText(content, "contact", "heading", "Get in touch")}</h2>
              {showContact && sectionText(content, "contact", "intro") ? (
                <p className="mt-4 max-w-xl text-[var(--lx-muted)]">{sectionText(content, "contact", "intro")}</p>
              ) : null}
              <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
                {showContact ? (
                  <div>
                    <h3 className={h3}>Contact</h3>
                    <ul className="mt-5 grid gap-1">
                      {phoneHref ? (
                        <li>
                          <a href={phoneHref} className="flex min-h-11 items-center gap-3 hover:underline">
                            <Phone className="size-[18px] text-[var(--lx-muted)]" aria-hidden />
                            {business.phone}
                          </a>
                        </li>
                      ) : null}
                      {business.email ? (
                        <li>
                          <a href={`mailto:${business.email}`} className="flex min-h-11 items-center gap-3 break-all hover:underline">
                            <Mail className="size-[18px] shrink-0 text-[var(--lx-muted)]" aria-hidden />
                            {business.email}
                          </a>
                        </li>
                      ) : null}
                      {waHref ? (
                        <li>
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 items-center gap-3 hover:underline"
                          >
                            <MessageCircle className="size-[18px] text-[var(--lx-muted)]" aria-hidden />
                            WhatsApp us
                          </a>
                        </li>
                      ) : null}
                    </ul>
                    <Socials links={socials} className="mt-5 text-[var(--lx-ink)]" />
                  </div>
                ) : null}
                {showVisit && hours.length ? (
                  <div>
                    <h3 className={h3}>Opening hours</h3>
                    <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 text-sm">
                      {hoursByDay(hours).map((day) => (
                        <div key={day.weekday} className="contents">
                          <dt className="text-[var(--lx-muted)]">{day.label}</dt>
                          <dd className={day.text === "Closed" ? "text-[var(--lx-muted)]" : "font-medium"}>{day.text}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
                {showVisit && address ? (
                  <div>
                    <h3 className={h3}>{sectionText(content, "visit", "heading", "Visit us")}</h3>
                    <p className="mt-5 flex gap-3">
                      <MapPin className="mt-1 size-[18px] shrink-0 text-[var(--lx-muted)]" aria-hidden />
                      {address}
                    </p>
                    {sectionText(content, "visit", "directions") ? (
                      <p className="mt-3 text-sm text-[var(--lx-muted)]">{sectionText(content, "visit", "directions")}</p>
                    ) : null}
                    {sectionFlag(content, "visit", "showMap") ? (
                      <iframe
                        title={`Map of ${business.name}`}
                        src={mapEmbedUrl(address)}
                        className="mt-6 h-56 w-full rounded-xl border border-[var(--lx-line)] bg-[var(--lx-beige)]"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              {showContact && sectionFlag(content, "contact", "showForm") ? (
                <div className="mt-14 max-w-2xl rounded-xl border border-[var(--lx-line)] bg-[var(--lx-cream)] p-6 md:p-8">
                  <h3 className={`${h3} mb-6`}>Send us a message</h3>
                  <ContactForm slug={business.slug} demo={demo} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {shown.has("booking") ? (
          <section className="relative isolate overflow-hidden bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]">
            {heroImage ? (
              <>
                <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[72%_30%]" />
                <div aria-hidden className="absolute inset-0 -z-10 bg-[rgba(18,12,8,0.78)]" />
              </>
            ) : null}
            <div className={`${container} py-20 text-center md:py-24 ${heroImage ? "text-[#f8f5ee]" : ""}`}>
              <h2 className={h2}>{sectionText(content, "booking", "heading", "Ready for your next look?")}</h2>
              {sectionText(content, "booking", "body") ? (
                <p className="mx-auto mt-4 max-w-lg opacity-90">{sectionText(content, "booking", "body")}</p>
              ) : null}
              <BookButton href={book} label={sectionText(content, "booking", "ctaLabel")} className="mt-8" />
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-white/10 bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]">
        <div className={`${container} grid gap-8 py-12 md:grid-cols-[auto_1fr_auto] md:items-center`}>
          <Wordmark name={business.name} logo={sectionText(content, "brand", "logo")} />
          {nav.length ? (
            <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-2 text-sm md:justify-center">
              {nav.map((link) => (
                <a key={link.href} href={link.href} className="opacity-85 hover:opacity-100">
                  {link.label}
                </a>
              ))}
            </nav>
          ) : (
            <span />
          )}
          <Socials links={socials} />
        </div>
        <div className={`${container} flex flex-col gap-2 border-t border-white/10 py-6 text-xs opacity-75 md:flex-row md:justify-between`}>
          <p>
            © {new Date().getFullYear()} {business.name}
            {address ? ` · ${address}` : ""}
          </p>
          <p>
            Website by{" "}
            <a href="https://glamsitestudio.com" className="underline underline-offset-4">
              Glam Site Studios
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
