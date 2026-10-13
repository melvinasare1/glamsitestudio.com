import type { OpeningHours, Service, ServiceCategory, Weekday } from "./types";

export const WEEKDAYS: { value: Weekday; label: string; short: string }[] = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
  { value: 6, label: "Sunday", short: "Sun" },
];

export const CURRENCIES = [
  { code: "GBP", label: "£ British pound" },
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ US dollar" },
] as const;

/** 4500 GBP → "£45", 4550 → "£45.50" */
export function formatMoney(cents: number, currency: string): string {
  const hasPence = cents % 100 !== 0;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: hasPence ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(hasPence ? 2 : 0)} ${currency}`;
  }
}

export function formatServicePrice(service: Pick<Service, "priceCents" | "priceIsFrom">, currency: string): string {
  if (service.priceCents == null) return "Price on consultation";
  const amount = formatMoney(service.priceCents, currency);
  return service.priceIsFrom ? `From ${amount}` : amount;
}

/** 90 → "1 hr 30 min" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

/** "13:30" → "1:30pm" */
export function formatTime(value: string): string {
  const [h = "0", m = "0"] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "pm" : "am";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return m === "00" ? `${twelve}${suffix}` : `${twelve}:${m}${suffix}`;
}

/** One line per weekday: "9am – 6pm", "9am – 1pm, 2pm – 6pm" or "Closed". */
export function hoursByDay(hours: OpeningHours[]): { weekday: Weekday; label: string; text: string }[] {
  return WEEKDAYS.map((day) => {
    const slots = hours
      .filter((row) => row.weekday === day.value)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      .map((row) => `${formatTime(row.opensAt)} – ${formatTime(row.closesAt)}`);
    return { weekday: day.value, label: day.label, text: slots.length ? slots.join(", ") : "Closed" };
  });
}

/** Services grouped by category in display order; uncategorised services come last. */
export function groupServices(
  categories: ServiceCategory[],
  services: Service[]
): { category: ServiceCategory | null; services: Service[] }[] {
  const byPosition = <T extends { position: number; name: string }>(a: T, b: T) =>
    a.position - b.position || a.name.localeCompare(b.name);
  const groups: { category: ServiceCategory | null; services: Service[] }[] = [...categories]
    .sort(byPosition)
    .map((category) => ({
      category,
      services: services.filter((service) => service.categoryId === category.id).sort(byPosition),
    }));
  const loose = services
    .filter((service) => !service.categoryId || !categories.some((c) => c.id === service.categoryId))
    .sort(byPosition);
  if (loose.length) groups.push({ category: null, services: loose });
  return groups.filter((group) => group.services.length);
}

export function formatAddress(address: { line1: string; line2: string; city: string; postcode: string }): string {
  return [address.line1, address.line2, address.city, address.postcode].filter((part) => part.trim()).join(", ");
}
