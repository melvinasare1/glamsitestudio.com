"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-muted-foreground focus:border-brand";

export function RepeatableStringList({
  label,
  hint,
  values,
  onChange,
  placeholder = "e.g. Vegan & Cruelty-free",
  addLabel = "Add feature",
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const rows = values.length > 0 ? values : [""];

  function setAt(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <span className="text-sm font-semibold text-ink-950">{label}</span>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-2 space-y-2">
        {rows.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              onChange={(event) => setAt(index, event.target.value)}
              placeholder={placeholder}
              maxLength={80}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              aria-label="Remove"
              onClick={() => removeAt(index)}
              className="shrink-0 rounded-lg px-2 text-muted-foreground hover:text-ink-950"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-sm font-medium text-ink-950 hover:text-ink-800"
        )}
      >
        <PlusIcon className="size-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

export function cleanStringList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const item = raw.trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item.slice(0, 80));
  }
  return out.slice(0, 20);
}
