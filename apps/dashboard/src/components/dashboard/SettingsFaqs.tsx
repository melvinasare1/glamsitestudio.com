"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { saveSellerFaqs } from "@/app/dashboard/settings/actions";
import { useSeller } from "@/lib/seller-context";
import type { StoreFaq } from "@glamsite/shared/types";

const INPUT_CLASS =
  "mt-1.5 w-full rounded-lg border border-wire bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-ink-700/40 focus:border-signal";

function emptyPair(): StoreFaq {
  return { question: "", answer: "" };
}

export function SettingsFaqs() {
  const router = useRouter();
  const { seller } = useSeller();
  const [pairs, setPairs] = useState<StoreFaq[]>([emptyPair()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!seller) return;
    setPairs(seller.faqs.length > 0 ? seller.faqs.map((item) => ({ ...item })) : [emptyPair()]);
  }, [seller]);

  function patch(index: number, patch: Partial<StoreFaq>) {
    setPairs((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await saveSellerFaqs(pairs);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <section className="mt-6 rounded-xl border border-wire bg-white p-6">
      <h2 className="font-display text-base font-semibold text-ink-950">FAQs</h2>
      <p className="mt-2 text-sm text-ink-700/60">
        One list for the whole shop. These show on every product page.
      </p>

      <div className="mt-4 space-y-4">
        {pairs.map((pair, index) => (
          <div key={index} className="rounded-lg border border-wire p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-700/50">
                Question {index + 1}
              </p>
              <button
                type="button"
                aria-label={`Remove FAQ ${index + 1}`}
                onClick={() => {
                  setPairs((prev) => (prev.length <= 1 ? [emptyPair()] : prev.filter((_, i) => i !== index)));
                  setSaved(false);
                }}
                className="text-ink-700/40 hover:text-ink-950"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <label className="mt-2 block">
              <span className="text-sm font-medium text-ink-950">Question</span>
              <input
                value={pair.question}
                onChange={(event) => patch(index, { question: event.target.value })}
                placeholder="How long does delivery take?"
                maxLength={200}
                className={INPUT_CLASS}
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-ink-950">Answer</span>
              <textarea
                rows={3}
                value={pair.answer}
                onChange={(event) => patch(index, { answer: event.target.value })}
                placeholder="We dispatch within 24 hours in Accra, 2–4 days elsewhere."
                maxLength={1000}
                className={`${INPUT_CLASS} resize-y`}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          setPairs((prev) => [...prev, emptyPair()]);
          setSaved(false);
        }}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink-950 hover:text-ink-800"
      >
        <PlusIcon className="size-3.5" />
        Add FAQ
      </button>

      {error ? <p className="mt-3 text-sm text-delta-down">{error}</p> : null}
      {saved && !error ? <p className="mt-3 text-sm text-delta-up">FAQs saved.</p> : null}

      <div className="mt-4">
        <button
          type="button"
          disabled={saving || !seller}
          onClick={() => void handleSave()}
          className="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save FAQs"}
        </button>
      </div>
    </section>
  );
}
