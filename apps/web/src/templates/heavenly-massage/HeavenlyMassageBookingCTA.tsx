import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";

export function HeavenlyMassageBookingCTA({ bookingHref }: { bookingHref: string }) {
  return (
    <section id="booking" className="relative isolate flex min-h-[190px] items-center justify-center overflow-hidden bg-[#62452f] px-5 py-12 text-center text-[#fffaf4] sm:min-h-[210px] sm:py-14">
      <Image src="/templates/heavenly-massage/hero-secondary.webp" alt="" fill sizes="100vw" className="-z-20 object-cover object-center" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#3d2818]/75 via-[#3d2818]/85 to-[#3d2818]/70" />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="font-[family-name:var(--hm-heading)] text-3xl leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">Ready to unwind?</h2>
        <p className="mt-2 font-[family-name:var(--hm-heading)] text-base text-white/85 sm:text-lg">Book your treatment today.</p>
        <a href={bookingHref} className="mt-5 inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-[var(--hm-paper)] px-6 py-3 text-sm font-medium text-[var(--hm-ink)] shadow-sm transition hover:scale-[1.02] sm:px-8">
          <CalendarDays className="size-4" aria-hidden />
          Book Appointment
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
