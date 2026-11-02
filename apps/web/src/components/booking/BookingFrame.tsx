/* eslint-disable @next/next/no-img-element -- owner logos come from storage at unknown sizes */
import { sectionText } from "@glamsite/shared/site-content";
import type { Business } from "@glamsite/shared/types";
import { brandColors, brandStyle, inkOn } from "@/templates/shared";

/**
 * The page around booking and "manage your appointment": the salon's own
 * name, colours and fonts, on a quiet white page so it reads as theirs.
 */
export function BookingFrame({
  business,
  homeHref,
  children,
}: {
  business: Business | null;
  homeHref: string;
  children: React.ReactNode;
}) {
  const logo = business ? sectionText(business.content, "brand", "logo") : "";
  // Same defaults as brandStyle, plus readable text colours for brand and accent surfaces.
  const colors = business ? brandColors(business, { primary: "#1f1a17", accent: "#f3ebe4" }) : null;
  const style =
    business && colors
      ? ({
          ...brandStyle(business),
          "--brand-ink": inkOn(colors.primary),
          "--accent-ink": inkOn(colors.accent),
        } as React.CSSProperties)
      : undefined;
  return (
    <div
      style={style}
      className="min-h-screen bg-white font-[family-name:var(--font-copy)] text-[#1f1a1c]"
    >
      <header className="border-b border-[#ece6e3]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <a href={homeHref} className="flex min-w-0 items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-9 w-auto max-w-[140px] object-contain" /> : null}
            <span className="truncate font-[family-name:var(--font-heading)] text-lg">{business?.name ?? "Booking"}</span>
          </a>
          <a href={homeHref} className="shrink-0 text-sm text-[#6e6468] underline-offset-4 hover:underline">
            Back to site
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-32 pt-8 md:pt-12">{children}</main>
    </div>
  );
}

export function BookingNotice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl">{title}</h1>
      {children ? <p className="mt-4 text-[#6e6468]">{children}</p> : null}
    </div>
  );
}
