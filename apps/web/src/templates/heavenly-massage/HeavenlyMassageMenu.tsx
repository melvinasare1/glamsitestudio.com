"use client";

import { useState } from "react";
import type { Service, ServiceCategory } from "@glamsite/shared/types";
import { ArrowRight, X } from "lucide-react";

export function HeavenlyMassageMenu({ categories, services, bookingHref }: { categories: ServiceCategory[]; services: Service[]; bookingHref: string }) {
  const visibleCategories = [...categories].sort((a,b)=>a.position-b.position);
  const [activeCategory, setActiveCategory] = useState(visibleCategories[0]?.id ?? "");
  const [selected, setSelected] = useState<Service|null>(null);
  const items = services.filter(s=>s.isVisible && s.isBookable && s.categoryId===activeCategory).sort((a,b)=>a.position-b.position);
  const formatPrice = (s:Service) => s.priceCents == null ? "Price on request" : (s.priceIsFrom ? "From " : "") + new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(s.priceCents/100);
  return (
    <section id="treatment-menu" className="bg-[var(--hm-cream)] px-5 py-12 md:px-8 md:py-16 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="mb-6 font-[family-name:var(--hm-heading)] text-3xl tracking-[-0.04em] sm:text-4xl">Treatment Menu</h2>
        <div role="tablist" aria-label="Treatment categories" className="mb-0 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {visibleCategories.map(c=><button key={c.id} type="button" role="tab" aria-selected={activeCategory===c.id} onClick={()=>setActiveCategory(c.id)} className={`shrink-0 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors sm:px-7 ${activeCategory===c.id ? "bg-[var(--hm-olive)] text-white":"bg-[#eee2d8] text-[var(--hm-ink)] hover:bg-[#e5d7ca]"}`}>{c.name}</button>)}
        </div>
        <div role="tabpanel" className="rounded-2xl border border-[var(--hm-line)] bg-[var(--hm-paper)] p-4 sm:p-5">
          {items.length ? <ul className="divide-y divide-[var(--hm-line)]">
            {items.map(s=><li key={s.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-[family-name:var(--hm-heading)] text-lg leading-tight sm:text-xl">{s.name}</h3>
                {s.description ? <p className="mt-1 text-sm leading-relaxed text-[var(--hm-muted)]">{s.description}</p>:null}
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end sm:min-w-[170px]">
                <span className="whitespace-nowrap text-sm font-medium">{s.durationMinutes} min <span className="mx-2 text-[var(--hm-muted)]">|</span> {formatPrice(s)}</span>
                <button type="button" onClick={()=>setSelected(s)} className="min-w-[92px] rounded-full border border-[var(--hm-muted)] px-5 py-2 text-sm transition hover:bg-[var(--hm-ink)] hover:text-[var(--hm-paper)]">Book</button>
              </div>
            </li>)}
          </ul>:<p className="py-8 text-center text-sm text-[var(--hm-muted)]">No treatments in this category yet.</p>}
        </div>
      </div>
      {selected ? <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6" onClick={()=>setSelected(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="hm-book-confirm-title" className="w-full max-w-md rounded-3xl bg-[var(--hm-paper)] p-6 shadow-2xl sm:p-8" onClick={e=>e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hm-muted)]">Your treatment</p><h3 id="hm-book-confirm-title" className="mt-2 font-[family-name:var(--hm-heading)] text-2xl leading-tight">{selected.name}</h3></div>
            <button type="button" aria-label="Close confirmation" onClick={()=>setSelected(null)} className="rounded-full p-2 hover:bg-[var(--hm-sand)]"><X className="size-5"/></button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--hm-muted)]">Would you like to book this treatment?</p>
          <div className="mt-5 rounded-2xl bg-[var(--hm-sand)] p-4 text-sm"><div className="flex justify-between gap-3"><span>{selected.durationMinutes} minutes</span><span className="font-medium">{formatPrice(selected)}</span></div></div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={()=>setSelected(null)} className="rounded-full border border-[var(--hm-line)] px-6 py-3 text-sm font-medium">Not now</button>
            <a href={bookingHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--hm-olive)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--hm-olive-dark)]">Continue <ArrowRight className="size-4"/></a>
          </div>
        </div>
      </div>:null}
    </section>
  );
}
