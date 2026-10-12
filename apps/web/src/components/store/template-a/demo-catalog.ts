import type { Product } from "@glamsite/shared/types";
import { TEMPLATE_A_SHIRT_IMAGES } from "@/components/store/template-a/product-images";

export type TemplateADemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  shortDescription?: string;
  category: string;
  createdAt: number;
  colors: string[];
  sizes: string[];
  images: string[];
  features?: string[];
};

export const TEMPLATE_A_DEMO_PRODUCTS: TemplateADemoProduct[] = [
  {
    id: "demo-split-panel-shirt",
    name: "Split Panel Shirt",
    description:
      "A short-sleeve button-up with a split print: orange stripes on one side and a floral panel on the other.",
    shortDescription: "Split-print camp shirt for warm days.",
    priceCedis: 130,
    compareAtPriceCedis: 165,
    category: "Tops & Tees",
    createdAt: 4,
    colors: ["Orange", "Cream", "Black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [TEMPLATE_A_SHIRT_IMAGES[0]],
    features: ["Split-panel print", "Turn-down collar", "Relaxed short sleeve"],
  },
  {
    id: "demo-tropical-floral-shirt",
    name: "Tropical Floral Shirt",
    description: "Open-collar short sleeve with a tropical lily print on a pale blue ground. Light enough for warm days.",
    priceCedis: 245,
    category: "Tops & Tees",
    createdAt: 3,
    colors: ["Blue", "Orange", "White"],
    sizes: ["S", "M", "L", "XL"],
    images: [TEMPLATE_A_SHIRT_IMAGES[1]],
    features: ["Tropical print", "Camp collar", "Easy over a tee"],
  },
  {
    id: "demo-painterly-stripe-shirt",
    name: "Painterly Stripe Shirt",
    description: "A camp shirt in painterly vertical stripes — cyan, gold, magenta, and black on a light ground.",
    priceCedis: 180,
    category: "Tops & Tees",
    createdAt: 2,
    colors: ["Blue", "Yellow", "Orange"],
    sizes: ["S", "M", "L"],
    images: [TEMPLATE_A_SHIRT_IMAGES[2]],
    features: ["Brushstroke stripes", "Chest pocket", "Rounded hem"],
  },
  {
    id: "demo-graphic-print-shirt",
    name: "Graphic Print Shirt",
    description: "A teal short-sleeve covered in collage graphics and slogans. Loud on purpose.",
    priceCedis: 220,
    category: "Tops & Tees",
    createdAt: 1,
    colors: ["Sky", "Green", "Orange"],
    sizes: ["S", "M", "L", "XL"],
    images: [TEMPLATE_A_SHIRT_IMAGES[3]],
    features: ["All-over graphic print", "Cuffed short sleeve", "Streetwear cut"],
  },
];

export const TEMPLATE_A_DEMO_FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Orders in Accra usually go out within 24 hours. Other regions typically arrive in 2–4 days after dispatch.",
  },
  {
    question: "Can I return an item?",
    answer:
      "Yes — unused items with tags on can be returned within 7 days. Damaged or not-as-described items are always eligible.",
  },
  {
    question: "How do I choose a size?",
    answer:
      "Sizes follow a standard chart. If you are between sizes, size up for a relaxed fit or stay true to size for a closer cut.",
  },
];

export function getTemplateADemoProduct(id: string): TemplateADemoProduct | undefined {
  return TEMPLATE_A_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function templateADemoToProduct(item: TemplateADemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: item.images,
    stockQuantity: 14,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    colors: item.colors,
    sizes: item.sizes,
    features: item.features ?? [],
    variants:
      item.id === "demo-split-panel-shirt"
        ? [
            {
              id: "demo-split-panel-shirt-color",
              name: "Color",
              values: item.colors,
              sku: "DEMOSPLITPANELSHIRT-CLR",
              priceCedis: item.priceCedis,
              stockQuantity: 14,
              images: [],
              imagesByValue: {
                Orange: [TEMPLATE_A_SHIRT_IMAGES[0]],
                Cream: [TEMPLATE_A_SHIRT_IMAGES[1]],
                Black: [TEMPLATE_A_SHIRT_IMAGES[2]],
              },
            },
          ]
        : undefined,
  };
}
