import type { Product, ProductVariant } from "@glamsite/shared/types";

export const HAIR_BEAUTY_TEMPLATE_BASE = "/store/hair-beauty-template";

const IMG = "/store/hair-beauty-template/products";

export type HairDemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  shortDescription?: string;
  category: string;
  /** First image is the card / primary gallery shot. */
  images: string[];
  createdAt: number;
  features?: string[];
  variants?: ProductVariant[];
};

export const HAIR_DEMO_PRODUCTS: HairDemoProduct[] = [
  {
    id: "demo-body-wave-glueless-wig",
    name: "Body Wave Glueless Lace Front Wig",
    description:
      "Glueless body wave lace front with a melted hairline and breathable cap. Pre-plucked, ready to wear, and styled with soft volume for everyday glam.",
    shortDescription: "Glueless body wave. Natural hairline, breathable cap.",
    priceCedis: 1350,
    compareAtPriceCedis: 1580,
    category: "Wigs",
    images: [
      `${IMG}/body-wave-lace-1.jpg`,
      `${IMG}/body-wave-lace-2.jpg`,
      `${IMG}/body-wave-cap.webp`,
    ],
    createdAt: 8,
    features: ["Glueless wear-and-go", "13×4 lace", "Breathable adjustable cap"],
  },
  {
    id: "demo-kinky-curly-wig",
    name: "Kinky Curly Full Lace Wig",
    description:
      "Full-density kinky curly unit with soft stretch and bounce. Holds curl definition after wash and air-dry — no heat required.",
    shortDescription: "Full-density curls with lasting definition.",
    priceCedis: 1100,
    compareAtPriceCedis: 1280,
    category: "Wigs",
    images: [
      `${IMG}/kinky-curly-1.webp`,
      `${IMG}/kinky-curly-2.jpg`,
      `${IMG}/kinky-curly-3.webp`,
    ],
    createdAt: 7,
    features: ["High density", "Heat-friendly", "Wash & go"],
  },
  {
    id: "demo-highlight-curly-wig",
    name: "Honey Highlight Curly Lace Front Wig",
    description:
      "Voluminous curly lace front with honey-blonde and caramel highlights. Pre-plucked hairline for a seamless blend — piano colour that catches the light.",
    shortDescription: "Curly lace front with honey caramel highlights.",
    priceCedis: 1480,
    compareAtPriceCedis: 1720,
    category: "Wigs",
    images: [
      `${IMG}/highlight-curly-1.webp`,
      `${IMG}/highlight-curly-2.jpg`,
      `${IMG}/highlight-curly-3.jpg`,
    ],
    createdAt: 6,
    features: ["Piano highlights", "Pre-plucked lace", "Defined curls"],
  },
  {
    id: "demo-deep-wave-wig",
    name: "Deep Wave Wear-Go Half Wig",
    description:
      "3-in-1 deep wave half wig — style it down, half-up, or with braided edges. Glueless invisible hairline for protective, vacation-ready looks.",
    shortDescription: "3-in-1 deep wave. Glueless, versatile styling.",
    priceCedis: 980,
    compareAtPriceCedis: 1180,
    category: "Wigs",
    images: [
      `${IMG}/deep-wave-1.jpg`,
      `${IMG}/deep-wave-2.jpg`,
      `${IMG}/deep-wave-3.webp`,
      `${IMG}/deep-wave-4.webp`,
    ],
    createdAt: 5,
    features: ["3-in-1 styles", "Glueless half wig", "Invisible hairline"],
  },
  {
    id: "demo-silk-straight-bundle",
    name: "Silk Straight Bundle Set",
    description:
      "100% human hair straight bundles with a soft, glossy finish. Choose length and texture to match your install — double weft for fullness that lasts.",
    shortDescription: "Premium human hair bundles. Pick length and texture.",
    priceCedis: 850,
    compareAtPriceCedis: 980,
    category: "Bundles",
    images: [`${IMG}/body-wave-lace-2.jpg`, `${IMG}/body-wave-lace-1.jpg`],
    createdAt: 4,
    features: ["100% human hair", "Double weft", "Low shedding"],
    variants: [
      {
        id: "demo-silk-straight-length",
        name: "Length",
        values: ['14"', '18"', '22"', '26"'],
        sku: "HAIRBUNDLE-LEN",
        priceCedis: 850,
        stockQuantity: 12,
        images: [],
      },
      {
        id: "demo-silk-straight-texture",
        name: "Texture",
        values: ["Straight", "Body Wave", "Deep Wave"],
        sku: "HAIRBUNDLE-TEX",
        priceCedis: 850,
        stockQuantity: 12,
        images: [],
      },
    ],
  },
  {
    id: "demo-body-wave-closure",
    name: "Body Wave 4×4 Closure",
    description:
      "Medium brown lace closure with soft body wave texture. Bleach-friendly knots and a seamless blend with matching bundles.",
    shortDescription: "Soft body wave closure for a flawless finish.",
    priceCedis: 320,
    compareAtPriceCedis: 380,
    category: "Closures",
    images: [`${IMG}/body-wave-cap.webp`, `${IMG}/body-wave-lace-1.jpg`],
    createdAt: 3,
    features: ["4×4 lace", "Medium brown", "Bleach-friendly knots"],
  },
  {
    id: "demo-clip-in-extensions",
    name: "Clip-In Extension Set",
    description:
      "Seven-piece clip-in set for instant length and volume. Easy to install and remove — ideal for weekends, shoots, and travel.",
    shortDescription: "Seven-piece clip-ins for instant volume.",
    priceCedis: 480,
    category: "Extensions",
    images: [`${IMG}/highlight-curly-3.jpg`, `${IMG}/highlight-curly-2.jpg`],
    createdAt: 2,
    features: ["7 pieces", "Secure clips", "Reusable"],
  },
  {
    id: "demo-frontal-bundle-deal",
    name: "Frontal + Bundle Deal",
    description:
      "Ear-to-ear frontal paired with two matching bundles. One cart add for a complete sew-in look — colour-matched and ready to ship.",
    shortDescription: "Frontal plus two bundles, colour-matched.",
    priceCedis: 1450,
    compareAtPriceCedis: 1650,
    category: "Bundles",
    images: [`${IMG}/deep-wave-2.jpg`, `${IMG}/kinky-curly-1.webp`],
    createdAt: 1,
    features: ["13×4 frontal", "2 bundles", "Colour-matched"],
  },
];

export const HAIR_DEMO_FAQS = [
  {
    question: "How do I pay?",
    answer:
      "Place the order on the site, then send Mobile Money to the number shown on the confirmation screen. The seller marks the order paid once they receive it.",
  },
  {
    question: "Is the hair 100% human?",
    answer:
      "Yes. Demo catalogue pieces are listed as premium human hair. Live shops set their own product details and care notes.",
  },
  {
    question: "Where do you deliver?",
    answer: "Accra usually next day. Other regions typically arrive 2–4 days after dispatch.",
  },
];

export function getHairDemoProduct(id: string): HairDemoProduct | undefined {
  return HAIR_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function hairDemoToProduct(item: HairDemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: item.images,
    stockQuantity: 16,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    features: item.features ?? [],
    variants: item.variants,
  };
}
