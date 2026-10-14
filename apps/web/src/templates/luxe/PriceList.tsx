"use client";

import { useState } from "react";

export type PriceGroup = {
  id: string;
  name: string;
  rows: { id: string; name: string; description: string; duration: string; price: string }[];
};

/** The full price list with a tab per category ("All services" first). */
export function PriceList({ groups }: { groups: PriceGroup[] }) {
  const [active, setActive] = useState("all");
  const showTabs = groups.length > 1;
  const rows = groups.flatMap((group) => (active === "all" || active === group.id ? group.rows : []));
  const tabs = [{ id: "all", name: "All services" }, ...groups.map(({ id, name }) => ({ id, name }))];

  return (
    <div className="mt-10 rounded-xl border border-[var(--lx-line)] bg-white/60 p-3 md:p-4">
      {showTabs ? (
        <div
          role="group"
          aria-label="Filter services"
          className="flex gap-1 overflow-x-auto rounded-full border border-[var(--lx-line)] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition md:flex-1 ${
                  selected
                    ? "bg-[var(--lx-dark)] text-[var(--lx-dark-ink)]"
                    : "text-[var(--lx-muted)] hover:bg-[var(--lx-beige)]/60"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      ) : null}
      <ul className="mt-2 divide-y divide-[var(--lx-line)]">
        {rows.map((row) => (
          <li key={row.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 px-3 py-4 md:grid-cols-[1fr_10rem_8rem] md:px-4">
            <div>
              <p className="font-medium">{row.name}</p>
              {row.description ? <p className="mt-1 text-sm text-[var(--lx-muted)]">{row.description}</p> : null}
            </div>
            <p className="col-start-1 row-start-2 text-sm text-[var(--lx-muted)] md:col-start-2 md:row-start-1">
              {row.duration}
            </p>
            <p className="col-start-2 row-start-1 text-right font-semibold md:col-start-3">{row.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
