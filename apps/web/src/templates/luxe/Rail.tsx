"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A row of cards that scrolls sideways (swipe on phones, arrows on larger
 * screens). Arrows only appear when there is more to see.
 */
export function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setCanPrev(list.scrollLeft > 4);
    setCanNext(list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [update]);

  const scroll = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * list.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--lx-line)] bg-[var(--lx-cream)] text-[var(--lx-ink)] shadow-sm transition hover:bg-white md:flex";

  return (
    <div className="relative">
      <ul
        ref={listRef}
        aria-label={label}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {canPrev ? (
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous" className={`${arrow} -left-5`}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      ) : null}
      {canNext ? (
        <button type="button" onClick={() => scroll(1)} aria-label="Next" className={`${arrow} -right-5`}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
