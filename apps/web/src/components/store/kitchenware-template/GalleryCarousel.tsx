"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export type GalleryPiece = {
  id: string;
  name: string;
  image: string;
};

const VISIBLE = 5;

export default function GalleryCarousel({ pieces }: { pieces: GalleryPiece[] }) {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, pieces.length - VISIBLE);
  const visible = useMemo(() => pieces.slice(start, start + VISIBLE), [pieces, start]);

  return (
    <div className="relative">
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2
          className="max-w-xl text-[28px] font-medium leading-tight text-[#2B4239] md:text-[36px]"
          style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
        >
          Thoughtful, Planet-Prioritizing Ideas and Inspiration{" "}
          <span className="mx-1 text-[16px] not-italic" aria-hidden>
            ✧
          </span>{" "}
          <span className="font-semibold">Gallery</span>
        </h2>
        <div className="hidden shrink-0 gap-2 md:flex">
          <button
            type="button"
            aria-label="Previous gallery items"
            disabled={start === 0}
            onClick={() => setStart((s) => Math.max(0, s - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next gallery items"
            disabled={start >= maxStart}
            onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2B4239]/15 bg-white text-[#2B4239] disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((p) => (
          <article key={p.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#EDE8DC]">
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 20vw, 40vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#142822]/70 via-transparent to-transparent" />
            <p
              className="absolute bottom-4 left-4 right-3 text-[15px] font-medium leading-snug text-white"
              style={{ fontFamily: "var(--font-homedine-serif), ui-serif, Georgia" }}
            >
              {p.name}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
