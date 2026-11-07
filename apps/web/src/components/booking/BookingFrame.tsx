/* eslint-disable @next/next/no-img-element -- owner logos come from storage at unknown sizes */
import { Calendar } from "lucide-react";
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
      className="min-h-screen bg-[#FAF9F7] font-[family-name:var(--font-copy)] text-[#252321]"
    >
      <header className="border-b border-[#EAE8E5] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <a href={homeHref} className="flex min-w-0 items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-9 w-auto max-w-[140px] object-contain" /> : null}
            <span className="truncate font-[family-name:var(--font-heading)] text-lg">{business?.name ?? "Booking"}</span>
          </a>
          <a href={homeHref} className="shrink-0 text-sm text-[#625E5A] underline-offset-4 hover:underline">
            Back to site
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-32 pt-8 md:pt-12">{children}</main>
    </div>
  );
}

export function BookingNotice({
  title,
  children,
  actions,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#E8E6E3] bg-white p-10 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-[#F7F6F4]" aria-hidden>
        <Calendar className="size-6 text-[#8A8580]" />
      </span>
      <h1 className="mt-6 text-xl font-semibold">{title}</h1>
      {children ? <p className="mx-auto mt-2.5 text-sm leading-6 text-[#8A8580]">{children}</p> : null}
      {actions ? <div className="mx-auto mt-7 flex max-w-xs flex-col items-stretch gap-3">{actions}</div> : null}
    </div>
  );
}

/** A plain-text "or" between two notice actions. */
export function NoticeDivider() {
  return (
    <span className="text-xs" style={{ color: "#B9B4AE" }}>
      or
    </span>
  );
}

export function NoticeButton({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#E8E6E3] bg-white px-5 text-sm font-medium hover:bg-[#F7F6F4]"
    >
      {children}
    </a>
  );
}
