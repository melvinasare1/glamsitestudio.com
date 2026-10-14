import { ArrowRight } from "lucide-react";
import { BrowserFrame } from "./DeviceFrames";
import { SitePreview } from "./SitePreview";

/**
 * Template cards. Live templates show the real template rendered with demo
 * content; templates still being designed show a coded "coming soon" panel.
 */
const CARDS: { name: string; templateId: string | null }[] = [
  { name: "Luxe", templateId: "luxe" },
  { name: "Nail Studio", templateId: null },
  { name: "Barbershop", templateId: "barber" },
  { name: "Lash & Brow", templateId: null },
];

function ComingSoonPanel({ name }: { name: string }) {
  return (
    <div className="flex aspect-[1280/900] flex-col items-center justify-center gap-2 bg-gradient-to-br from-petal via-[#FBEAF0] to-petal-deep p-6 text-center">
      <span className="font-didone text-3xl leading-none">{name}</span>
      <span className="text-sm text-mauve">In design now</span>
    </div>
  );
}

export function TemplateGallery() {
  return (
    <ul className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const body = (
          <>
            <BrowserFrame>
              {card.templateId ? (
                <SitePreview templateId={card.templateId} viewportWidth={1280} viewportHeight={900} />
              ) : (
                <ComingSoonPanel name={card.name} />
              )}
            </BrowserFrame>
            <div className="mt-5 flex min-h-[3.75rem] items-center justify-between gap-4 border-b border-plum/15 pb-4">
              <span className="font-didone text-[1.75rem] leading-none tracking-[-0.01em]">{card.name}</span>
              {card.templateId ? (
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
            {card.templateId ? (
              <a href={`/demo/${card.templateId}`} className="group block" aria-label={`Open the ${card.name} demo`}>
                {body}
              </a>
            ) : (
              <div>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
