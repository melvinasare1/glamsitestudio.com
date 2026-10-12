"use client";

import { useState } from "react";
import { PencilIcon, XIcon } from "lucide-react";
import type { SellerCategory } from "@/lib/product-categories";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "mt-0 w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-muted-foreground focus:border-brand";

export function OptionManager({
  label,
  hint,
  options,
  selectedNames,
  multiple = false,
  placeholder = "New name",
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  label: string;
  hint?: string;
  options: SellerCategory[];
  selectedNames: string[];
  multiple?: boolean;
  placeholder?: string;
  onSelect: (names: string[]) => void;
  onCreate: (name: string) => Promise<void>;
  onRename: (option: SellerCategory, name: string) => Promise<void>;
  onDelete: (option: SellerCategory) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function submitCreate() {
    const name = draft.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await onCreate(name);
      setDraft("");
    } finally {
      setCreating(false);
    }
  }

  function toggle(name: string) {
    if (multiple) {
      onSelect(
        selectedNames.includes(name)
          ? selectedNames.filter((item) => item !== name)
          : [...selectedNames, name]
      );
      return;
    }
    onSelect(selectedNames[0] === name ? [] : [name]);
  }

  async function submitRename(option: SellerCategory) {
    const name = editName.trim();
    if (!name || savingEdit) return;
    setSavingEdit(true);
    try {
      await onRename(option, name);
      setEditingId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      <span className="text-sm font-semibold text-ink-950">{label}</span>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitCreate();
            }
          }}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          disabled={creating || !draft.trim()}
          onClick={() => void submitCreate()}
          className="shrink-0 rounded-lg bg-ink-950 px-3 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {options.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {options.map((row) => {
            const selected = selectedNames.includes(row.name);
            const editing = editingId === row.id;
            return (
              <li key={row.id}>
                {editing ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void submitRename(row);
                        }
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="w-28 rounded-md border border-black/10 bg-white px-2 py-0.5 text-sm outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={savingEdit || !editName.trim()}
                      onClick={() => void submitRename(row)}
                      className="text-xs font-medium"
                    >
                      Save
                    </button>
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm",
                      selected ? "bg-ink-950 text-white" : "bg-muted text-ink-950"
                    )}
                  >
                    <button type="button" onClick={() => toggle(row.name)}>
                      {row.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Rename ${row.name}`}
                      onClick={() => {
                        setEditingId(row.id);
                        setEditName(row.name);
                      }}
                      className={selected ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-ink-950"}
                    >
                      <PencilIcon className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${row.name}`}
                      onClick={() => void onDelete(row)}
                      className={selected ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-ink-950"}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
