"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ImagePlusIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  PRODUCT_IMAGE_ACCEPT,
  uploadProductImage,
  validateProductImage,
} from "@/lib/product-images";
import { cn } from "@/lib/utils";
import { storefrontUrl } from "@/lib/storefront-url";
import { createClient } from "@glamsite/shared/supabase/client";
import {
  emptyRepeatableItem,
  getStorefrontContentFields,
  getStorefrontEditorPages,
  isRepeatableField,
  parseStorefrontContent,
  storefrontContentForSave,
  storefrontPageLabel,
  type StorefrontContent,
  type StorefrontContentField,
  type StorefrontContentItemField,
  type StorefrontContentRepeatableField,
  type StorefrontContentScalarType,
  type StorefrontContentValue,
  type StorefrontRepeatableItem,
} from "@glamsite/shared/storefront-content-schema";
import type { Seller } from "@glamsite/shared/types";

const FIELD_CLASS =
  "w-full rounded-lg border border-wire bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-ink-700/40 focus:border-signal";

function valueHasContent(value: StorefrontContentValue | undefined): boolean {
  if (typeof value === "string") return Boolean(value.trim());
  if (!Array.isArray(value)) return false;
  return value.some((item) => Object.values(item).some((entry) => entry.trim()));
}

function valuesFromContent(
  fields: StorefrontContentField[],
  content: StorefrontContent
): StorefrontContent {
  return Object.fromEntries(
    fields.map((field) => {
      if (isRepeatableField(field)) {
        const value = content[field.key];
        return [field.key, Array.isArray(value) ? value : []];
      }
      const value = content[field.key];
      return [field.key, typeof value === "string" ? value : ""];
    })
  );
}

export function StorefrontEditor({
  seller,
  initialContent,
}: {
  seller: Seller;
  initialContent: StorefrontContent;
}) {
  const router = useRouter();
  const fields = useMemo(() => getStorefrontContentFields(seller.template), [seller.template]);
  const pages = useMemo(() => getStorefrontEditorPages(seller.template), [seller.template]);
  const [activePage, setActivePage] = useState(pages[0] ?? "");
  const [values, setValues] = useState<StorefrontContent>(() =>
    valuesFromContent(fields, initialContent)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const storeUrl = storefrontUrl(seller);

  useEffect(() => {
    const fromServer = valuesFromContent(fields, initialContent);
    setValues(fromServer);

    const hasSavedValue = fields.some((field) => valueHasContent(fromServer[field.key]));
    if (hasSavedValue) return;

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sellers")
        .select("store_content")
        .eq("id", seller.id)
        .maybeSingle();
      if (cancelled || error) return;
      const next = valuesFromContent(fields, parseStorefrontContent(data?.store_content));
      if (!fields.some((field) => valueHasContent(next[field.key]))) return;
      setValues(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [fields, initialContent, seller.id]);

  useEffect(() => {
    if (pages.length === 0) return;
    if (!pages.includes(activePage)) setActivePage(pages[0] ?? "");
  }, [pages, activePage]);

  function setField(key: string, value: StorefrontContentValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const payload = storefrontContentForSave(fields, values);
      const { data, error: updateError } = await supabase
        .from("sellers")
        .update({ store_content: payload })
        .eq("id", seller.id)
        .select("id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("Could not save storefront content. Try signing in again.");
      setValues(payload);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save storefront content.");
    } finally {
      setSaving(false);
    }
  }

  if (pages.length === 0) {
    return (
      <p className="mt-6 text-sm text-ink-700/60">
        Content editing for this template is not available yet.
      </p>
    );
  }

  const pageFields = getStorefrontContentFields(seller.template, activePage);

  return (
    <form onSubmit={onSubmit} className="mt-8 pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <EditorSectionNav pages={pages} activePage={activePage} onChange={setActivePage} />

        <div className="min-w-0 flex-1">
          <section className="rounded-xl border border-wire bg-white px-6 py-7 shadow-card md:px-8 md:py-8">
            <header className="border-b border-wire pb-5">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
                {storefrontPageLabel(activePage)}
              </h2>
            </header>

            {pageFields.length === 0 ? (
              <p className="mt-6 text-sm text-ink-700/60">No editable content on this page yet.</p>
            ) : (
              <div className="divide-y divide-wire">
                {pageFields.map((field) => {
                  if (isRepeatableField(field)) {
                    const raw = values[field.key];
                    return (
                      <div key={field.key} className="py-8 first:pt-7 last:pb-0">
                        <RepeatableEditorField
                          field={field}
                          value={Array.isArray(raw) ? raw : []}
                          sellerId={seller.id}
                          disabled={saving}
                          onChange={(next) => setField(field.key, next)}
                        />
                      </div>
                    );
                  }
                  const raw = values[field.key];
                  return (
                    <div key={field.key} className="py-8 first:pt-7 last:pb-0">
                      <EditorField
                        field={field}
                        value={typeof raw === "string" ? raw : ""}
                        sellerId={seller.id}
                        disabled={saving}
                        onChange={(next) => setField(field.key, next)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-ink-950 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save storefront content"}
            </button>
            {saved && storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-wire px-4 py-2 text-sm font-medium text-ink-950 hover:border-signal"
              >
                View store
              </a>
            ) : null}
          </div>
          {saved && !storeUrl ? (
            <p className="mt-3 text-sm text-ink-700/60">Saved. Set a store slug to view your live shop.</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function EditorSectionNav({
  pages,
  activePage,
  onChange,
}: {
  pages: string[];
  activePage: string;
  onChange: (page: string) => void;
}) {
  return (
    <>
      <div className="lg:hidden">
        <label
          htmlFor="editor-section"
          className="text-xs font-semibold tracking-wide text-ink-700/45 uppercase"
        >
          Section
        </label>
        <div className="relative mt-2">
          <select
            id="editor-section"
            value={activePage}
            onChange={(event) => onChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-wire bg-white px-4 py-3 pr-10 text-sm font-semibold text-ink-950 outline-none focus:border-signal"
          >
            {pages.map((page) => (
              <option key={page} value={page}>
                {storefrontPageLabel(page)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-700/45" />
        </div>
      </div>

      <nav
        aria-label="Storefront sections"
        className="hidden w-52 shrink-0 lg:sticky lg:top-24 lg:block xl:w-56"
      >
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-ink-700/45 uppercase">
          Sections
        </p>
        <ul className="space-y-1">
          {pages.map((page) => {
            const active = page === activePage;
            return (
              <li key={page}>
                <button
                  type="button"
                  onClick={() => onChange(page)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-brand-soft font-semibold text-brand before:absolute before:top-1/2 before:left-0 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-brand"
                      : "font-medium text-ink-700/65 hover:bg-white hover:text-ink-950"
                  )}
                >
                  {storefrontPageLabel(page)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function EditorField({
  field,
  value,
  sellerId,
  disabled,
  onChange,
}: {
  field: {
    key: string;
    label: string;
    description?: string;
    type: StorefrontContentScalarType;
    placeholder: string;
  };
  value: string;
  sellerId: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel
        htmlFor={`store-content-${field.key}`}
        label={field.label}
        description={field.description}
        value={field.type === "image" ? undefined : value}
      />
      <div className="mt-5">
        {field.type === "text" ? (
          <input
            id={`store-content-${field.key}`}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className={FIELD_CLASS}
          />
        ) : null}
        {field.type === "textarea" ? (
          <textarea
            id={`store-content-${field.key}`}
            rows={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className={FIELD_CLASS}
          />
        ) : null}
        {field.type === "image" ? (
          <ContentImageField
            id={`store-content-${field.key}`}
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            sellerId={sellerId}
            disabled={disabled}
            onChange={onChange}
          />
        ) : null}
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
  description,
  value,
}: {
  htmlFor?: string;
  label: string;
  description?: string;
  value?: string;
}) {
  const trimmed = value?.trim() ?? "";
  const preview =
    trimmed.length > 0
      ? trimmed.length > 120
        ? `${trimmed.slice(0, 120)}…`
        : trimmed
      : null;

  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-950">
        {label}
      </label>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-700/50">{description}</p>
      ) : null}
      {value !== undefined ? (
        preview ? (
          <p className="mt-3.5 rounded-md border border-wire/70 bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink-700">
            Currently on your shop: <span className="font-medium text-ink-950">{preview}</span>
          </p>
        ) : (
          <p className="mt-3.5 text-xs italic text-ink-700/45">
            Nothing saved yet — shoppers see the template default.
          </p>
        )
      ) : null}
    </div>
  );
}

function RepeatableEditorField({
  field,
  value,
  sellerId,
  disabled,
  onChange,
}: {
  field: StorefrontContentRepeatableField;
  value: StorefrontRepeatableItem[];
  sellerId: string;
  disabled: boolean;
  onChange: (value: StorefrontRepeatableItem[]) => void;
}) {
  function updateItem(index: number, key: string, next: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, [key]: next } : item)));
  }

  function moveItem(index: number, delta: number) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-wire bg-mist/60 p-5 md:p-6">
      <FieldLabel label={field.label} description={field.description} />
      <div className="mt-5 space-y-4">
        {value.map((item, index) => (
          <article
            key={`${field.key}-${index}`}
            className="rounded-xl border border-wire bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-ink-700/55 uppercase">
                {field.itemLabel} {index + 1}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move ${field.itemLabel} up`}
                  className="rounded-md p-1.5 text-ink-700 hover:bg-mist disabled:opacity-30"
                >
                  <ChevronUpIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={disabled || index === value.length - 1}
                  aria-label={`Move ${field.itemLabel} down`}
                  className="rounded-md p-1.5 text-ink-700 hover:bg-mist disabled:opacity-30"
                >
                  <ChevronDownIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  disabled={disabled}
                  aria-label={`Remove ${field.itemLabel}`}
                  className="rounded-md p-1.5 text-ink-700 hover:bg-mist hover:text-destructive disabled:opacity-30"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {field.itemFields.map((itemField) => (
                <ItemEditorField
                  key={itemField.key}
                  field={itemField}
                  id={`store-content-${field.key}-${index}-${itemField.key}`}
                  value={item[itemField.key] ?? ""}
                  sellerId={sellerId}
                  disabled={disabled}
                  onChange={(next) => updateItem(index, itemField.key, next)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, emptyRepeatableItem(field)])}
        disabled={disabled}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-wire bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 hover:border-signal disabled:opacity-50"
      >
        <PlusIcon className="size-4" />
        Add {field.itemLabel}
      </button>
    </div>
  );
}

function ItemEditorField({
  field,
  id,
  value,
  sellerId,
  disabled,
  onChange,
}: {
  field: StorefrontContentItemField;
  id: string;
  value: string;
  sellerId: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel
        htmlFor={id}
        label={field.label}
        description={field.description}
        value={field.type === "image" ? undefined : value}
      />
      <div className="mt-4">
        {field.type === "text" ? (
          <input
            id={id}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className={FIELD_CLASS}
          />
        ) : null}
        {field.type === "textarea" ? (
          <textarea
            id={id}
            rows={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className={FIELD_CLASS}
          />
        ) : null}
        {field.type === "image" ? (
          <ContentImageField
            id={id}
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            sellerId={sellerId}
            disabled={disabled}
            onChange={onChange}
          />
        ) : null}
      </div>
    </div>
  );
}

function ContentImageField({
  id,
  label,
  placeholder,
  value,
  sellerId,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  sellerId: string;
  disabled: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const validationError = validateProductImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const supabase = createClient();
      const url = await uploadProductImage(supabase, sellerId, file, setProgress);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {value ? (
          <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-wire bg-mist sm:h-24 sm:w-28">
            {/* Public storage URLs; next/image remotePatterns are not required here. */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
              aria-label={`Remove ${label}`}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-ink-950/70 text-white disabled:opacity-40"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-wire bg-mist/50 sm:h-24 sm:w-28">
            <p className="px-2 text-center text-xs text-ink-700/45">No image saved</p>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-wire px-4 py-3 text-sm font-medium text-ink-700 hover:border-signal hover:text-ink-950 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <ImagePlusIcon className="size-4" />
                {value ? "Replace image" : placeholder}
              </>
            )}
          </button>
          {value ? (
            <p className="mt-1.5 truncate text-xs text-ink-700/60" title={value}>
              Current image is active on your shop.
            </p>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void onFile(file);
        }}
      />
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
