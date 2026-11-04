"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A live, read-only thumbnail of a template: an iframe of its demo page
 * (apps/web's /demo/[template]), rendered at full browser size and scaled
 * down with a CSS transform to fit the card. Decorative only, so it's kept
 * out of the tab order and hidden from screen readers.
 */
export function TemplatePreviewFrame({
  src,
  viewportWidth = 1280,
  viewportHeight = 900,
}: {
  src: string;
  viewportWidth?: number;
  viewportHeight?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / viewportWidth));
    observer.observe(frame);
    return () => observer.disconnect();
  }, [viewportWidth]);

  return (
    <div
      ref={frameRef}
      aria-hidden
      className="relative w-full overflow-hidden bg-mist"
      style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}
    >
      <iframe
        src={src}
        title=""
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none border-0 opacity-0 transition-opacity duration-300"
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale ?? 0})`,
          opacity: scale ? 1 : 0,
        }}
      />
    </div>
  );
}
