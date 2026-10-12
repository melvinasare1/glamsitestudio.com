"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { StoreFaq } from "@glamsite/shared/types";
import type { PdpChrome } from "@/components/store/pdp/chrome";

export function PdpFaqs({ faqs, chrome }: { faqs: StoreFaq[]; chrome: PdpChrome }) {
  const items = (faqs ?? []).filter((item) => item.question.trim() && item.answer.trim());
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className={chrome.sectionClass}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:gap-16">
        <h2 className={chrome.titleClass}>Frequently Asked Questions</h2>
        <div>
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={`${item.question}-${index}`} className={`border-t ${chrome.dividerClass}`}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className={chrome.questionClass}>{item.question}</span>
                  {open ? (
                    <Minus className={chrome.iconClass} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Plus className={chrome.iconClass} strokeWidth={1.75} aria-hidden />
                  )}
                </button>
                {open ? <p className={`pb-6 pr-10 ${chrome.bodyClass}`}>{item.answer}</p> : null}
              </div>
            );
          })}
          <div className={`border-t ${chrome.dividerClass}`} />
        </div>
      </div>
    </section>
  );
}
