"use client";

import { useEffect, useRef, useState } from "react";
import { TEMPLATES } from "@glamsite/shared/templates";

/**
 * The hero's one bold moment: a phone running the real demo site, scrollable,
 * with a switch between templates. Visitors see the product, not a picture of it.
 */
export function PhoneDemo() {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0];
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(296 / 390);

  // Keep the 390px-wide site filling the screen at any frame width.
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 390));
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="mx-auto w-full max-w-[320px]">
      <div className="relative rounded-[3rem] bg-plum p-3 shadow-[0_40px_80px_-30px_rgba(43,22,49,0.55)]">
        {/* 390×844 phone viewport scaled to fit the frame, below a status bar with the camera. */}
        <div ref={screenRef} className="relative aspect-[390/844] overflow-hidden rounded-[2.4rem] bg-white">
          <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-center bg-white" aria-hidden>
            <span className="h-[18px] w-20 rounded-full bg-plum" />
          </div>
          <iframe
            key={template.id}
            src={`/demo/${template.id}?embed=1`}
            title={`${template.name} template demo`}
            className="absolute left-0 top-8 h-[844px] w-[390px] origin-top-left border-0"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
      <figcaption className="mt-5 flex flex-col items-center gap-3">
        <div role="group" aria-label="Template" className="inline-flex rounded-full border border-hairline bg-white p-1">
          {TEMPLATES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === templateId}
              onClick={() => setTemplateId(item.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                item.id === templateId ? "bg-plum text-white" : "text-mauve hover:text-plum"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <span className="text-xs text-mauve">A real site. Scroll it.</span>
      </figcaption>
    </figure>
  );
}
