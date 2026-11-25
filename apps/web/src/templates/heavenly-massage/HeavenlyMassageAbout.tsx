import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function HeavenlyMassageAbout({ bookingHref }: { bookingHref: string }) {
  return (
    <section id="about" className="bg-[var(--hm-cream)] px-5 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] md:aspect-[1.8/1]">
          <Image
            src="/templates/heavenly-massage/hero-secondary.webp"
            alt="A peaceful massage room prepared for a relaxing treatment"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="max-w-xl md:py-3">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--hm-muted)] sm:text-xs">About Sōma</p>
          <h2 className="max-w-[600px] font-[family-name:var(--hm-heading)] text-[2.5rem] leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]">
            A space for total relaxation.
          </h2>
          <p className="mt-4 max-w-lg font-[family-name:var(--hm-heading)] text-lg leading-relaxed text-[var(--hm-ink)] sm:text-xl">
            Personalised massage treatments to help you unwind, relieve tension and feel your best.
          </p>
          <a href={bookingHref} className="mt-6 inline-flex min-h-11 items-center gap-4 rounded-full border border-[var(--hm-muted)] px-6 py-3 text-sm font-medium transition hover:bg-[var(--hm-ink)] hover:text-[var(--hm-paper)]">
            Book Appointment <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
