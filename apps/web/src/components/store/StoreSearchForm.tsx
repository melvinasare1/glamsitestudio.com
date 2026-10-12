"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StoreSearchForm({
  action,
  placeholder,
  className,
  inputClassName,
}: {
  action: string;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `${action}?q=${encodeURIComponent(next)}` : action);
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <label className="block min-w-0">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </label>
    </form>
  );
}
