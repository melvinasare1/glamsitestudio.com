import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * Template cards. Designs without a live demo yet are shown as coming soon,
 * so nobody clicks through to something that doesn't exist.
 */
const CARDS = [
  { name: "Hair Salon", image: "/marketing/card-salon.jpg", demo: "/demo/salon" },
  { name: "Nail Studio", image: "/marketing/card-nails.jpg", demo: null },
  { name: "Barbershop", image: "/marketing/card-barber.jpg", demo: "/demo/barber" },
  { name: "Lash & Brow", image: "/marketing/card-lash.jpg", demo: null },
] as const;

export function TemplateGallery() {
  return (
    <ul className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const body = (
          <>
            <div className="overflow-hidden rounded-t-2xl bg-petal p-2 pb-0">
              <Image
                src={card.image}
                alt={`${card.name} template preview`}
                width={293}
                height={317}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full rounded-t-xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-b border-plum/15 pb-4">
              <span className="font-didone text-[1.75rem] leading-none tracking-[-0.01em]">{card.name}</span>
              {card.demo ? (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-petal text-berry transition-colors group-hover:bg-berry group-hover:text-white">
                  <ArrowRight className="size-5" aria-hidden />
                </span>
              ) : (
                <span className="shrink-0 text-sm text-mauve">Coming soon</span>
              )}
            </div>
          </>
        );
        return (
          <li key={card.name}>
            {card.demo ? (
              <a href={card.demo} className="group block" aria-label={`Open the ${card.name} demo`}>
                {body}
              </a>
            ) : (
              <div className="group block">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
