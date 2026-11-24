import { ArrowRight } from "lucide-react";

const treatments = [
  { title: "Relaxation\nMassage", image: "/templates/heavenly-massage/hero.webp" },
  { title: "Deep Tissue\nMassage", image: "/templates/heavenly-massage/hero-secondary.webp" },
  { title: "Hot Stone\nMassage", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85" },
  { title: "Aromatherapy\nMassage", image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=85" },
];

export function HeavenlyMassageTreatments() {
  return (
    <section id="services" className="bg-[var(--hm-cream)] px-5 py-10 md:px-8 md:py-14 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--hm-heading)] text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">Our Treatments</h2>
          <a href="#treatment-menu" className="group inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium underline underline-offset-4 sm:text-sm">
            View Treatment Menu <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {treatments.map((treatment) => (
            <a key={treatment.title} href="#treatment-menu" className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#6b4b32] text-white shadow-sm">
              <div aria-hidden className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${treatment.image}')` }} />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                <h3 className="whitespace-pre-line font-[family-name:var(--hm-heading)] text-lg leading-[1.08] tracking-[-0.02em] sm:text-xl">{treatment.title}</h3>
                <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/75 transition group-hover:bg-white group-hover:text-[#281b14]"><ArrowRight className="size-4" /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
