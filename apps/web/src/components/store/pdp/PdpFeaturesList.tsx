import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { formatCedis } from "@/lib/price";

export function PdpFeaturesList({
  features,
  accent,
  listClassName = "mt-5 space-y-2",
  itemClassName,
  strokeWidth = 2,
}: {
  features: string[];
  accent: string;
  listClassName?: string;
  itemClassName: string;
  strokeWidth?: number;
}) {
  if (features.length === 0) return null;
  return (
    <ul className={listClassName}>
      {features.map((feature) => (
        <li key={feature} className={itemClassName}>
          <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={strokeWidth} color={accent} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function PdpShortDescription({
  text,
  className,
}: {
  text?: string;
  className: string;
}) {
  const value = text?.trim();
  if (!value) return null;
  return <p className={className}>{value}</p>;
}

export function PdpComparePrice({
  priceCedis,
  compareAtPriceCedis,
  wrapClassName,
  priceClassName,
  compareClassName,
  priceStyle,
}: {
  priceCedis: number;
  compareAtPriceCedis?: number;
  wrapClassName?: string;
  priceClassName: string;
  compareClassName: string;
  priceStyle?: CSSProperties;
}) {
  const showCompare =
    compareAtPriceCedis != null && Number.isFinite(compareAtPriceCedis) && compareAtPriceCedis > priceCedis;

  return (
    <p className={wrapClassName}>
      {showCompare ? (
        <span className={compareClassName}>{formatCedis(compareAtPriceCedis)}</span>
      ) : null}
      <span className={priceClassName} style={priceStyle}>
        {formatCedis(priceCedis)}
      </span>
    </p>
  );
}
