import { sectionText } from "@glamsite/shared/site-content";
import { visibleSections } from "@glamsite/shared/templates";
import type { SiteData } from "@glamsite/shared/types";
import { bookingHref } from "../shared";
import { HeavenlyMassageHeader } from "./HeavenlyMassageHeader";
import { HeavenlyMassageHero } from "./HeavenlyMassageHero";
import { HeavenlyMassageTreatments } from "./HeavenlyMassageTreatments";
import { heavenlySans, heavenlySerif } from "./fonts";

const HEAVENLY = {
  cream: "#fbf5ef",
  paper: "#fffaf5",
  sand: "#eee2d8",
  olive: "#304321",
  oliveDark: "#253719",
  ink: "#281b14",
  muted: "#78695e",
  line: "rgba(83, 62, 45, 0.17)",
};

export function HeavenlyMassageSite({ data, demo = false }: { data: SiteData; demo?: boolean }) {
  const { business } = data;
  const { content } = business;
  const shown = new Set(visibleSections(business.templateId, content));
  const book = demo ? "#booking" : bookingHref(business);

  const style = {
    "--hm-cream": HEAVENLY.cream,
    "--hm-paper": HEAVENLY.paper,
    "--hm-sand": HEAVENLY.sand,
    "--hm-olive": HEAVENLY.olive,
    "--hm-olive-dark": HEAVENLY.oliveDark,
    "--hm-ink": HEAVENLY.ink,
    "--hm-muted": HEAVENLY.muted,
    "--hm-line": HEAVENLY.line,
    "--hm-heading": "var(--hm-font-serif)",
    "--hm-body": "var(--hm-font-sans)",
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className={`${heavenlySerif.variable} ${heavenlySans.variable} min-h-screen bg-[var(--hm-cream)] font-[family-name:var(--hm-body)] text-[var(--hm-ink)] antialiased`}
    >
      <HeavenlyMassageHeader
        businessName={business.name}
        logo={sectionText(content, "brand", "logo")}
        bookingHref={book}
      />
      <main id="top">
        {shown.has("hero") ? (
          <HeavenlyMassageHero
            headline={sectionText(content, "hero", "headline", "Relax, restore and rebalance")}
            tagline={sectionText(content, "hero", "tagline")}
            subheadline={sectionText(content, "hero", "subheadline")}
            image={sectionText(content, "hero", "image")}
            mobileImage={sectionText(content, "hero", "mobileImage")}
            secondaryImage={sectionText(content, "hero", "secondaryImage")}
            bookingHref={book}
            bookingLabel={sectionText(content, "hero", "ctaLabel", "Book appointment")}
          />
        ) : null}
        {shown.has("services") ? <HeavenlyMassageTreatments /> : null}
      </main>
    </div>
  );
}
