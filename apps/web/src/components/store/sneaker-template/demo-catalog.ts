import type { Product } from "@glamsite/shared/types";

export const SNEAKER_TEMPLATE_BASE = "/store/sneaker-template";

export function sneakerSearchAllHref(base: string): string {
  return `${base}/search?category=${encodeURIComponent("All")}`;
}

const TRAINERS = "/store/sneaker-template/trainers";

const WOMEN_SIZES = ["36", "37", "38", "39", "40", "41"];
const MEN_SIZES = ["40", "41", "42", "43", "44", "45"];
const KIDS_SIZES = ["28", "30", "32", "34", "35"];

export type SneakerDemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  shortDescription?: string;
  category: string;
  createdAt: number;
  stockQuantity: number;
  colors?: string[];
  sizes?: string[];
  features?: string[];
  images: string[];
};

export const SNEAKER_DEMO_PRODUCTS: SneakerDemoProduct[] = [
  {
    id: "demo-air-max-90",
    name: "Nike Air Max 90 — White / Teal",
    description:
      "The classic Air Max 90 in white leather with mint Air and a light grey Swoosh. A clean everyday pair that still reads as a runner.",
    shortDescription: "White leather Air Max 90 with mint Air.",
    priceCedis: 1450,
    compareAtPriceCedis: 1650,
    category: "Women",
    createdAt: 7,
    stockQuantity: 10,
    sizes: WOMEN_SIZES,
    colors: ["#F5F0EA", "#7EC8C3"],
    features: ["Visible Air unit", "Leather overlays", "Waffle outsole"],
    images: [`${TRAINERS}/air-max-90-pair.webp`, `${TRAINERS}/air-max-90-side.webp`],
  },
  {
    id: "demo-asics-gel",
    name: "Asics GEL runner — White / Silver",
    description:
      "A retro technical runner in white mesh with metallic silver overlays and a black outsole. Cushioned underfoot, loud enough for the street.",
    shortDescription: "White mesh runner with metallic silver overlays.",
    priceCedis: 1280,
    category: "Women",
    createdAt: 6,
    stockQuantity: 9,
    sizes: WOMEN_SIZES,
    colors: ["#FFFFFF", "#C0C0C0"],
    features: ["Breathable mesh", "GEL cushioning", "Metallic overlays"],
    images: [`${TRAINERS}/asics-pair.webp`, `${TRAINERS}/asics-side.webp`],
  },
  {
    id: "demo-zoomx-invincible",
    name: "Nike ZoomX Invincible — Kids",
    description:
      "A bright mint-and-white ZoomX runner in kids’ sizes. Soft foam underfoot and a knit upper that is easy to pull on.",
    shortDescription: "Mint ZoomX runner in kids’ sizes.",
    priceCedis: 890,
    category: "Kids",
    createdAt: 5,
    stockQuantity: 7,
    sizes: KIDS_SIZES,
    colors: ["#FFFFFF", "#3DCDC0"],
    features: ["ZoomX foam", "Flyknit upper", "Road outsole"],
    images: [`${TRAINERS}/zoomx-pair.webp`, `${TRAINERS}/zoomx-side.webp`],
  },
  {
    id: "demo-nb-740",
    name: "New Balance 740 — Triple Black",
    description:
      "The 740 in black mesh with silver N branding and Abzorb cushioning. A chunky heritage runner that works with everything.",
    shortDescription: "Black mesh 740 with silver N and Abzorb.",
    priceCedis: 1350,
    category: "Men",
    createdAt: 4,
    stockQuantity: 11,
    sizes: MEN_SIZES,
    colors: ["#1A1A1A", "#C0C0C0"],
    features: ["Abzorb cushioning", "Mesh upper", "Silver N logo"],
    images: [`${TRAINERS}/nb-740-pair.webp`, `${TRAINERS}/nb-740-side.webp`],
  },
  {
    id: "demo-p6000-black",
    name: "Nike P-6000 — Triple Black",
    description:
      "Early-2000s running lines in an all-black P-6000. Layered overlays, a glossy Swoosh, and a sculpted midsole.",
    shortDescription: "All-black P-6000 with layered overlays.",
    priceCedis: 1180,
    category: "Men",
    createdAt: 3,
    stockQuantity: 8,
    sizes: MEN_SIZES,
    colors: ["#111111"],
    features: ["Layered upper", "Sculpted midsole", "Flat laces"],
    images: [`${TRAINERS}/p6000-black-side.webp`],
  },
  {
    id: "demo-zx-750",
    name: "Adidas ZX 750 — Core Black",
    description:
      "A ZX 750 in black suede and mesh with white Three Stripes. Retro runner proportions, gum-free black outsole.",
    shortDescription: "Black suede ZX 750 with white stripes.",
    priceCedis: 980,
    category: "Men",
    createdAt: 2,
    stockQuantity: 12,
    sizes: MEN_SIZES,
    colors: ["#1A1A1A", "#FFFFFF"],
    features: ["Suede overlays", "Three Stripes", "EVA midsole"],
    images: [`${TRAINERS}/zx750-pair.webp`, `${TRAINERS}/zx750-side.webp`],
  },
  {
    id: "demo-p6000-grey",
    name: "Nike P-6000 — Grey / Black",
    description:
      "A junior-friendly P-6000 in grey mesh with black overlays. Same layered look as the men’s pair, in kids’ sizes.",
    shortDescription: "Grey and black P-6000 in kids’ sizes.",
    priceCedis: 720,
    category: "Kids",
    createdAt: 1,
    stockQuantity: 14,
    sizes: KIDS_SIZES,
    colors: ["#9AA0A6", "#111111"],
    features: ["Layered upper", "Easy lace-up", "Grippy outsole"],
    images: [`${TRAINERS}/p6000-grey-pair.webp`, `${TRAINERS}/p6000-grey-side.webp`],
  },
];

export const SNEAKER_DEMO_FAQS = [
  {
    question: "How do I pick a size?",
    answer: "Most pairs fit true to size. If you are between sizes, size up — especially on the runner.",
  },
  {
    question: "Can I swap a pair?",
    answer: "Yes — message us with your ANS- reference before dispatch and we will swap size or colour if we have it.",
  },
  {
    question: "How are pairs packed?",
    answer: "Each pair ships in its box, photographed before it leaves, so you can see the exact pair you ordered.",
  },
];

export function getSneakerDemoProduct(id: string): SneakerDemoProduct | undefined {
  return SNEAKER_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function sneakerDemoToProduct(item: SneakerDemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: item.images,
    stockQuantity: item.stockQuantity,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    sizes: item.sizes,
    colors: item.colors,
    features: item.features ?? [],
  };
}
