"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { FieldValue, ListField, ListItem, ScalarField } from "@glamsite/shared/site-content";
import { Field } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageInput } from "./image-input";

/** One control for one schema field. New field types only need a case here. */
export function ScalarInput({
  id,
  field,
  value,
  onChange,
  businessId,
}: {
  id: string;
  field: ScalarField;
  value: FieldValue | undefined;
  onChange: (value: string | boolean) => void;
  businessId: string;
}) {
  const text = typeof value === "string" ? value : "";
  const fallback = typeof field.defaultValue === "string" ? field.defaultValue : "";

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          id={id}
          value={text}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={field.maxLength && field.maxLength > 600 ? 6 : 3}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "image":
      return <ImageInput businessId={businessId} value={text} onChange={onChange} />;
    case "toggle": {
      const checked = typeof value === "boolean" ? value : field.defaultValue === true;
      return <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(next)} />;
    }
    case "color": {
      const color = text || fallback || "#000000";
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={color}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-white p-1"
          />
          <Input
            value={text}
            placeholder={fallback}
            maxLength={7}
            className="w-28 font-mono"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );
    }
    case "select":
      return (
        <Select value={text || fallback} onValueChange={(next) => onChange(next)}>
          <SelectTrigger id={id} className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          id={id}
          type={field.type === "url" ? "url" : "text"}
          value={text}
          placeholder={field.placeholder ?? fallback}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

/** A repeatable list (gallery photos, reviews, FAQs). */
export function ListInput({
  field,
  value,
  onChange,
  businessId,
  idPrefix,
}: {
  field: ListField;
  value: FieldValue | undefined;
  onChange: (items: ListItem[]) => void;
  businessId: string;
  idPrefix: string;
}) {
  const items = Array.isArray(value) ? value : [];
  const empty = (): ListItem => Object.fromEntries(field.itemFields.map((item) => [item.key, ""]));

  const update = (index: number, key: string, next: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: next } : item)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-black/8 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {field.itemLabel} {index + 1}
            </p>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${field.itemLabel.toLowerCase()}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            {field.itemFields.map((itemField) => {
              const id = `${idPrefix}-${index}-${itemField.key}`;
              return (
                <Field key={itemField.key} id={id} label={itemField.label} description={itemField.description}>
                  <ScalarInput
                    id={id}
                    field={itemField}
                    value={item[itemField.key]}
                    businessId={businessId}
                    onChange={(next) => update(index, itemField.key, String(next))}
                  />
                </Field>
              );
            })}
          </div>
        </div>
      ))}
      {items.length < field.maxItems ? (
        <Button type="button" variant="outline" className="justify-self-start" onClick={() => onChange([...items, empty()])}>
          <PlusIcon /> Add {field.itemLabel.toLowerCase()}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          You&apos;ve reached the limit of {field.maxItems}.
        </p>
      )}
    </div>
  );
}
