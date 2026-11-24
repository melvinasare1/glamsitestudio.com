import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { HeroPhoto } from "../HeroPhoto";
import { opensInNewTab } from "../shared";

export function HeavenlyMassageHero({
  headline,
  tagline,
  subheadline,
  image,
  mobileImage,
  secondaryImage,
  bookingHref,
  bookingLabel,
}: {
  headline: string;
  tagline: string;
  subheadline: string;
  image: string;
  mobileImage: string;
  secondaryImage: string;
  bookingHref: string;
  bookingLabel: string;
}) {
  const external = opensInNewTab(bookingHref)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <section
      aria-labelledby="heavenly-hero-heading"
      className="relative isolate flex aspect-[3/4] items-end overflow-hidden bg-[#62452f] text-[#fffaf4] md:aspect-auto md:min-h-[420px] md:items-center lg:min-h-[450px]"
    >
      <HeroPhoto
        image={image}
        mobileImage={mobileImage}
        priority
        className="-z-20 object-cover object-center md:object-[68%_center]"
      />
      {secondaryImage ? (
        <div className="absolute right-6 top-8 hidden h-[300px] w-[250px] overflow-hidden rounded-[2rem] border border-white/30 shadow-2xl md:block lg:right-16 lg:top-12 lg:h-[340px] lg:w-[300px]">
          <Image src={secondaryImage} alt="" fill sizes="(min-width: 1024px) 300px, 250px" className="object-cover" />
        </div>
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(48,32,20,0.94)_0%,rgba(48,32,20,0.72)_32%,rgba(48,32,20,0.12)_58%,rgba(48,32,20,0)_100%)] md:bg-[linear-gradient(90deg,rgba(48,32,20,0.94)_0%,rgba(63,42,27,0.83)_34%,rgba(63,42,27,0.16)_72%,rgba(63,42,27,0.03)_100%)]"
      />
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-10 pt-16 md:px-8 md:py-20 lg:px-16">
        <div className="max-w-[570px]">
          {tagline ? (
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f2d8ae] md:text-xs">
              {tagline}
            </p>
          ) : null}
          <h1
            id="heavenly-hero-heading"
            className="max-w-[560px] font-[family-name:var(--hm-heading)] text-[2.9rem] leading-[0.99] tracking-[-0.045em] sm:text-6xl md:text-[4.5rem] md:leading-[0.98]"
          >
            {headline}
          </h1>
          {subheadline ? (
            <p className="mt-5 max-w-[440px] font-[family-name:var(--hm-heading)] text-base leading-7 text-white/90 md:text-lg md:leading-8">
              {subheadline}
            </p>
          ) : null}
          <a
            href={bookingHref}
            {...external}
            className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-white/80 bg-[var(--hm-olive)] px-6 text-sm font-medium text-white shadow-md transition hover:bg-[var(--hm-olive-dark)] md:px-7"
          >
            <CalendarDays className="size-[17px]" aria-hidden />
            {bookingLabel}
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
