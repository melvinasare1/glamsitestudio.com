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
    <div className="mx-auto max-w-lg py-20 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#F3F1EE]" aria-hidden>
        <Calendar className="size-[26px] text-[#77716B]" />
      </span>
      <h1 className="mt-7 font-[family-name:var(--font-heading)] text-3xl md:text-4xl">{title}</h1>
      {children ? <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#77716B]">{children}</p> : null}
      {actions ? <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">{actions}</div> : null}
    </div>
  );
}

export function NoticeButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-[var(--brand-ink)] hover:opacity-90"
    >
      {children}
    </a>
  );
}

export function NoticeLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#EAE8E5] bg-white px-5 text-sm font-medium hover:bg-[#FAF9F7]"
    >
      {children}
    </a>
  );
}
