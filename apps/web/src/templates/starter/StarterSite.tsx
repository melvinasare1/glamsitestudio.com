/* eslint-disable @next/next/no-img-element -- owner photos come from storage at unknown sizes */
import {
  isSectionEnabled,
  sectionFlag,
  sectionItems,
  sectionText,
  type SectionKey,
} from "@glamsite/shared/site-content";
import { formatAddress, formatDuration, formatServicePrice, groupServices, hoursByDay } from "@glamsite/shared/format";
import { visibleSections } from "@glamsite/shared/templates";
import type { SiteData } from "@glamsite/shared/types";
import { telHref, whatsappHref } from "@/lib/contact";
import { ContactForm } from "../ContactForm";
import { bookingHref, brandStyle, mapEmbedUrl, opensInNewTab } from "../shared";

/**
 * Plain layout that renders every section from the shared content schema.
 * All templates use it until their own designs are built (stage 2, step 4),
 * and it stays as the reference for what each section must show.
 */
export function StarterSite({ data, demo = false }: { data: SiteData; demo?: boolean }) {
  const { business, categories, services, staff, hours } = data;
  const content = business.content;
  const book = bookingHref(business);
  const bookTarget = opensInNewTab(book) ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const logo = sectionText(content, "brand", "logo");
  const address = formatAddress(business.address);
  const sections = visibleSections(business.templateId, content);

  const heading = (key: SectionKey, fallback: string) => (
    <h2 className="font-[family-name:var(--font-heading)] text-3xl tracking-tight md:text-4xl">
      {sectionText(content, key, "heading", fallback)}
    </h2>
  );

  const renderers: Partial<Record<SectionKey, () => React.ReactNode>> = {
    hero: () => {
      const image = sectionText(content, "hero", "image");
      return (
        <section key="hero" className="relative overflow-hidden bg-[var(--accent)]">
          {image ? (
            <>
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40" aria-hidden />
            </>
          ) : null}
          <div className={`relative mx-auto max-w-5xl px-6 py-28 md:py-40 ${image ? "text-white" : ""}`}>
            <h1 className="max-w-2xl font-[family-name:var(--font-heading)] text-4xl leading-tight md:text-6xl">
              {sectionText(content, "hero", "headline", business.name)}
            </h1>
            {sectionText(content, "hero", "subheadline") ? (
              <p className="mt-5 max-w-xl text-lg opacity-90">{sectionText(content, "hero", "subheadline")}</p>
            ) : null}
            <a
              href={book}
              {...bookTarget}
              className="mt-8 inline-flex rounded-full bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              {sectionText(content, "hero", "ctaLabel")}
            </a>
          </div>
        </section>
      );
    },
    about: () => {
      const image = sectionText(content, "about", "image");
      const body = sectionText(content, "about", "body");
      if (!body && !image) return null;
      return (
        <section key="about" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            {heading("about", "About us")}
            <p className="mt-5 whitespace-pre-line leading-relaxed opacity-80">{body}</p>
          </div>
          {image ? <img src={image} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" /> : null}
        </section>
      );
    },
    services: () => {
      const groups = groupServices(categories, services);
      if (!groups.length) return null;
      return (
        <section key="services" id="services" className="bg-[var(--accent)]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            {heading("services", "Services & prices")}
            {sectionText(content, "services", "intro") ? (
              <p className="mt-4 max-w-2xl opacity-80">{sectionText(content, "services", "intro")}</p>
            ) : null}
            <div className="mt-10 grid gap-10">
              {groups.map((group) => (
                <div key={group.category?.id ?? "other"}>
                  {group.category ? (
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest opacity-70">
                      {group.category.name}
                    </h3>
                  ) : null}
                  <ul className="divide-y divide-black/10 border-y border-black/10">
                    {group.services.map((service) => (
                      <li key={service.id} className="flex items-start justify-between gap-6 py-4">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm opacity-60">{formatDuration(service.durationMinutes)}</p>
                          {service.description ? <p className="mt-1 text-sm opacity-70">{service.description}</p> : null}
                        </div>
                        <p className="shrink-0 font-medium">{formatServicePrice(service, business.currency)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    },
    team: () => {
      if (!staff.length) return null;
      return (
        <section key="team" className="mx-auto max-w-5xl px-6 py-20">
          {heading("team", "Meet the team")}
          {sectionText(content, "team", "intro") ? (
            <p className="mt-4 max-w-2xl opacity-80">{sectionText(content, "team", "intro")}</p>
          ) : null}
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {staff.map((person) => (
              <li key={person.id}>
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.name} className="aspect-square w-full rounded-xl object-cover" />
                ) : (
                  <div
                    className="flex aspect-square w-full items-center justify-center rounded-xl bg-[var(--accent)] text-4xl font-[family-name:var(--font-heading)]"
                    aria-hidden
                  >
                    {person.name.charAt(0)}
                  </div>
                )}
                <p className="mt-4 font-medium">{person.name}</p>
                {person.role ? <p className="text-sm opacity-60">{person.role}</p> : null}
                {person.bio ? <p className="mt-2 text-sm opacity-80">{person.bio}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      );
    },
    gallery: () => {
      const images = sectionItems(content, "gallery", "images").filter((item) => item.image);
      if (!images.length) return null;
      return (
        <section key="gallery" className="mx-auto max-w-5xl px-6 py-20">
          {heading("gallery", "Our work")}
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((item, index) => (
              <li key={`${item.image}-${index}`}>
                <img src={item.image} alt={item.caption || ""} className="aspect-square w-full rounded-lg object-cover" />
                {item.caption ? <p className="mt-2 text-sm opacity-70">{item.caption}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      );
    },
    reviews: () => {
      const items = sectionItems(content, "reviews", "items").filter((item) => item.quote);
      if (!items.length) return null;
      return (
        <section key="reviews" className="bg-[var(--accent)]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            {heading("reviews", "Kind words")}
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {items.map((item, index) => (
                <li key={index} className="rounded-xl bg-white p-6">
                  <blockquote className="leading-relaxed">&ldquo;{item.quote}&rdquo;</blockquote>
                  {item.name || item.source ? (
                    <p className="mt-4 text-sm opacity-60">
                      {[item.name, item.source].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    },
    faqs: () => {
      const items = sectionItems(content, "faqs", "items").filter((item) => item.question);
      if (!items.length) return null;
      return (
        <section key="faqs" className="mx-auto max-w-3xl px-6 py-20">
          {heading("faqs", "Good to know")}
          <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {items.map((item, index) => (
              <details key={index} className="group py-4">
                <summary className="cursor-pointer list-none font-medium">{item.question}</summary>
                <p className="mt-3 whitespace-pre-line text-sm opacity-80">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    },
    visit: () => {
      const days = hoursByDay(hours);
      const anyHours = hours.length > 0;
      if (!anyHours && !address) return null;
      return (
        <section key="visit" id="visit" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
          <div>
            {heading("visit", "Visit us")}
            {address ? <p className="mt-5">{address}</p> : null}
            {sectionText(content, "visit", "directions") ? (
              <p className="mt-3 text-sm opacity-70">{sectionText(content, "visit", "directions")}</p>
            ) : null}
            {anyHours ? (
              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
                {days.map((day) => (
                  <div key={day.weekday} className="contents">
                    <dt className="opacity-70">{day.label}</dt>
                    <dd>{day.text}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          {address && sectionFlag(content, "visit", "showMap") ? (
            <iframe
              title={`Map of ${business.name}`}
              src={mapEmbedUrl(address)}
              className="h-80 w-full rounded-xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}
        </section>
      );
    },
    contact: () => {
      const whatsapp = sectionText(content, "contact", "whatsapp");
      const socials = (["instagram", "tiktok", "facebook"] as const)
        .map((key) => ({ key, href: sectionText(content, "contact", key) }))
        .filter((item) => item.href);
      const waHref = whatsapp ? whatsappHref(whatsapp, business.address.country) : null;
      const phoneHref = business.phone ? telHref(business.phone) : null;
      return (
        <section key="contact" id="contact" className="bg-[var(--accent)]">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
            <div>
              {heading("contact", "Get in touch")}
              {sectionText(content, "contact", "intro") ? (
                <p className="mt-4 opacity-80">{sectionText(content, "contact", "intro")}</p>
              ) : null}
              <ul className="mt-6 grid gap-2 text-sm">
                {phoneHref ? (
                  <li>
                    <a href={phoneHref} className="underline underline-offset-4">{business.phone}</a>
                  </li>
                ) : null}
                {business.email ? (
                  <li>
                    <a href={`mailto:${business.email}`} className="underline underline-offset-4">{business.email}</a>
                  </li>
                ) : null}
                {waHref ? (
                  <li>
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      WhatsApp us
                    </a>
                  </li>
                ) : null}
              </ul>
              {socials.length ? (
                <ul className="mt-6 flex gap-4 text-sm font-medium capitalize">
                  {socials.map((item) => (
                    <li key={item.key}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer">{item.key}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {sectionFlag(content, "contact", "showForm") ? <ContactForm slug={business.slug} demo={demo} /> : null}
          </div>
        </section>
      );
    },
    booking: () => (
      <section key="booking" className="bg-[var(--brand)] text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl">
              {sectionText(content, "booking", "heading", "Ready for your next appointment?")}
            </h2>
            {sectionText(content, "booking", "body") ? (
              <p className="mt-2 opacity-80">{sectionText(content, "booking", "body")}</p>
            ) : null}
          </div>
          <a
            href={book}
            {...bookTarget}
            className="rounded-full bg-white px-7 py-3 text-sm font-medium text-[var(--brand)] transition hover:opacity-90"
          >
            {sectionText(content, "booking", "ctaLabel")}
          </a>
        </div>
      </section>
    ),
  };

  return (
    <div style={brandStyle(business)} className="min-h-screen bg-white font-[family-name:var(--font-copy)] text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <a href="#" className="font-[family-name:var(--font-heading)] text-xl">
            {logo ? <img src={logo} alt={business.name} className="h-10 w-auto" /> : business.name}
          </a>
          <a
            href={book}
            {...bookTarget}
            className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {sectionText(content, "hero", "ctaLabel")}
          </a>
        </div>
      </header>
      <main>{sections.filter((key) => isSectionEnabled(content, key)).map((key) => renderers[key]?.() ?? null)}</main>
      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 text-sm opacity-60 md:flex-row md:justify-between">
          <p>
            © {new Date().getFullYear()} {business.name}
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
