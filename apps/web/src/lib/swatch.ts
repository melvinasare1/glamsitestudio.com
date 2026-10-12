const NAMED_COLORS: Record<string, string> = {
  cream: "#E8D5B5",
  orange: "#E07A2F",
  blue: "#7EB6D9",
  black: "#111111",
  green: "#2F9E44",
  white: "#FFFFFF",
  brown: "#C08A4D",
  pink: "#F783AC",
  yellow: "#F4C430",
  purple: "#7B2CBF",
  red: "#E03131",
  navy: "#1D3557",
  teal: "#2F9E9E",
  gray: "#ADB5BD",
  grey: "#ADB5BD",
  sky: "#74C0FC",
  crimson: "#C92A2A",
};

const PLACEHOLDER_FILLS = ["#2F9E9E", "#F4A261", "#1D3557", "#E9C46A", "#457B9D", "#6D597A"];

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}

/** Resolve a product color option (name or hex) to a CSS hex for swatches. */
export function swatchHex(value: string): string {
  const trimmed = value.trim();
  if (isHexColor(trimmed)) return trimmed;
  return NAMED_COLORS[trimmed.toLowerCase()] ?? "#C4C4C4";
}

export function isLightSwatch(hex: string): boolean {
  const value = hex.trim().toLowerCase();
  return value === "#fff" || value === "#ffffff" || value === "#e8d5b5";
}

export function fillFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % PLACEHOLDER_FILLS.length;
  }
  return PLACEHOLDER_FILLS[hash] ?? PLACEHOLDER_FILLS[0];
}
