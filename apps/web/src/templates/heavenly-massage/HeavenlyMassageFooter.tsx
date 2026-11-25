import { ArrowUp, Instagram, Facebook, Music2, ArrowRight } from "lucide-react";

export function HeavenlyMassageFooter({name,email,phone,bookingHref,instagram,tiktok,facebook}: {name:string;email:string;phone:string;bookingHref:string;instagram?:string;tiktok?:string;facebook?:string}) {
 const links=[{label:"Home",href:"#top"},{label:"Treatments",href:"#treatments"},{label:"About",href:"#about"},{label:"Treatment menu",href:"#treatment-menu"},{label:"FAQs",href:"#faqs"},{label:"Contact",href:"#contact"}];
 return <footer className="bg-[#304321] px-5 pb-6 pt-12 text-[#fffaf5] md:px-8 md:pt-14 lg:px-12">
  <div className="mx-auto max-w-[1440px]">
   <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-12">
    <div><h2 className="font-[family-name:var(--hm-heading)] text-3xl tracking-[-0.04em]">{name}</h2><p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">A little time for yourself. Relax, restore and rebalance.</p><a href={bookingHref} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fffaf5] px-5 py-3 text-sm font-medium text-[#281b14]">Book an appointment <ArrowRight className="size-4"/></a></div>
    <div><h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Explore</h3><nav className="mt-4 grid gap-3 text-sm">{links.map(l=><a key={l.label} href={l.href} className="w-fit text-white/85 transition hover:text-white">{l.label}</a>)}</nav></div>
    <div><h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Get in touch</h3><div className="mt-4 grid gap-3 text-sm text-white/85">{email?<a href={`mailto:${email}`}>{email}</a>:null}{phone?<a href={`tel:${phone}`}>{phone}</a>:null}{instagram?<a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><Instagram className="size-4"/> Instagram</a>:null}{facebook?<a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><Facebook className="size-4"/> Facebook</a>:null}{tiktok?<a href={tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><Music2 className="size-4"/> TikTok</a>:null}</div></div>
   </div>
   <div className="mt-10 flex flex-col gap-4 border-t border-white/20 pt-5 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {name}. All rights reserved.</p><a href="#top" className="inline-flex items-center gap-2 text-white/80 hover:text-white">Back to top <ArrowUp className="size-4"/></a></div>
  </div>
 </footer>;
}
