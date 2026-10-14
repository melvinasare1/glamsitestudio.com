"use client";

import { useEffect, useRef, useState } from "react";
import { demoSiteData } from "@glamsite/shared/demo";
import { SiteRenderer } from "@/templates";

/**
 * A real template rendered with its demo content, laid out at a fixed browser
 * size and scaled down to fit its frame. Decorative: not focusable or clickable.
 */
export function SitePreview({
  templateId,
  viewportWidth = 1280,
  viewportHeight = 800,
}: {
  templateId: string;
  viewportWidth?: number;
  viewportHeight?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  // inert keeps the preview's links and form out of the tab order (React 18 has no typed prop for it).
  useEffect(() => {
    contentRef.current?.setAttribute("inert", "");
  }, []);

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
      className="relative w-full overflow-hidden bg-white"
      style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}
    >
      <div
        ref={contentRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none overflow-hidden transition-opacity duration-300"
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale ?? 0})`,
          opacity: scale ? 1 : 0,
        }}
      >
        <SiteRenderer data={demoSiteData(templateId)} demo />
      </div>
    </div>
  );
}
