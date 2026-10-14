/** Device frames drawn in CSS. Whatever is inside them is a real, live component. */

export function DesktopFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure aria-label={label} className="mx-auto w-full">
      <div className="rounded-[1.25rem] bg-plum p-[1.6%] pb-[2.6%] shadow-[0_50px_90px_-40px_rgba(43,22,49,0.6)]">
        <div className="mx-auto mb-[1.2%] size-1.5 rounded-full bg-white/25" aria-hidden />
        <div className="overflow-hidden rounded-md">{children}</div>
      </div>
      {/* Stand and base */}
      <div aria-hidden className="mx-auto h-10 w-[16%] bg-gradient-to-b from-[#d9cdd2] to-[#efe6ea] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)] md:h-14" />
      <div aria-hidden className="mx-auto h-2 w-[34%] rounded-full bg-gradient-to-b from-[#e8dde2] to-[#d3c5cb] shadow-[0_8px_16px_-6px_rgba(43,22,49,0.35)]" />
    </figure>
  );
}

export function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-plum/10 bg-white shadow-[0_18px_40px_-24px_rgba(43,22,49,0.45)]">
      <div className="flex items-center gap-1.5 border-b border-plum/10 bg-porcelain px-3 py-2" aria-hidden>
        <span className="size-2 rounded-full bg-plum/15" />
        <span className="size-2 rounded-full bg-plum/15" />
        <span className="size-2 rounded-full bg-plum/15" />
      </div>
      {children}
    </div>
  );
}
