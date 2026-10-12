"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product } from "@glamsite/shared/types";
import { cartLineId } from "@/lib/checkout";
import {
  axesFromVariants,
  initialSelectedVariants,
  usesGenericVariantAxes,
  variantDisplaySuffix,
} from "@/components/store/pdp/variant-selection";

export function useProductVariantSelection(product: Product) {
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const axes = useMemo(() => axesFromVariants(product.variants), [product.variants]);
  const useGeneric = usesGenericVariantAxes(product.variants);

  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    initialSelectedVariants(axes)
  );

  const onSelectVariant = useCallback((axisName: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [axisName]: value }));
  }, []);

  const selection = useMemo(() => {
    if (useGeneric) {
      return { selectedVariants };
    }
    return {
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    };
  }, [useGeneric, selectedVariants, selectedSize, selectedColor]);

  const variantLabel = variantDisplaySuffix(selection);
  const lineId = cartLineId(product.id, selection);
  const cartName = variantLabel ? `${product.name} · ${variantLabel}` : product.name;

  return {
    sizes,
    colors,
    useGeneric,
    selectedSize,
    setSelectedSize,
    selectedColor,
    setSelectedColor,
    selectedVariants,
    onSelectVariant,
    selection,
    variantLabel,
    lineId,
    cartName,
    /** Color string for gallery helpers — first Color/Colour axis value when generic. */
    galleryColor: useGeneric
      ? Object.entries(selectedVariants).find(([name]) => {
          const label = name.trim().toLowerCase();
          return label === "color" || label === "colour";
        })?.[1]
      : selectedColor,
    gallerySize: useGeneric
      ? Object.entries(selectedVariants).find(([name]) => name.trim().toLowerCase() === "size")?.[1]
      : selectedSize,
  };
}
