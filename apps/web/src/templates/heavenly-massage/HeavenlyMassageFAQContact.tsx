"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { ContactForm } from "../ContactForm";

type FAQItem={question:string;answer:string};
export function HeavenlyMassageFAQContact({items,slug,demo=false}: {items:FAQItem[];slug:string;demo?:boolean}) {
 const [open,setOpen]=useState<number|null>(null);
 return <section id="faqs" className="bg-[var(--hm-cream)] px-5 py-12 md:px-8 md:py-16 lg:px-12">
  <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-2 md:gap-12">
   <div>
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--hm-muted)] sm:text-xs">FAQs</p>
    <h2 className="mb-6 font-[family-name:var(--hm-heading)] text-3xl tracking-[-0.04em] sm:text-4xl">Common Questions</h2>
    <div className="space-y-2">{items.map((item,i)=><div key={i} className="overflow-hidden rounded-2xl border border-[var(--hm-line)]">
      <button type="button" aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium sm:px-5">
       <span>{item.question}</span>{open===i?<Minus className="size-4 shrink-0"/>:<Plus className="size-4 shrink-0"/>}
      </button>{open===i?<div className="px-4 pb-4 text-sm leading-relaxed text-[var(--hm-muted)] sm:px-5">{item.answer}</div>:null}
    </div>)}</div>
   </div>
   <div id="contact" className="border-t border-[var(--hm-line)] pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--hm-muted)] sm:text-xs">Get in touch</p>
    <h2 className="mb-6 font-[family-name:var(--hm-heading)] text-3xl tracking-[-0.04em] sm:text-4xl">Send Us a Message</h2>
    <ContactForm slug={slug} demo={demo}/>
   </div>
  </div>
 </section>;
}
