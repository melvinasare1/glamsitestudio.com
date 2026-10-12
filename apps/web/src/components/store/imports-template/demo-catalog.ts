import type { Product } from "@glamsite/shared/types";

export const IMPORTS_TEMPLATE_BASE = "/store/imports-template";

export type ImportsDemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  shortDescription?: string;
  category: string;
  image: string;
  createdAt: number;
  features?: string[];
};

const IMG = "/store/imports-template";

export const IMPORTS_DEMO_PRODUCTS: ImportsDemoProduct[] = [
  {
    id: "demo-pepsi-max-8",
    name: "Pepsi Max, 8 × 330ml",
    description:
      "Sugar-free Pepsi Max in an 8-pack of 330ml cans. Maximum cola taste, no sugar — keep a pack in the fridge for the week.",
    shortDescription: "Sugar-free cola, 8 × 330ml cans.",
    priceCedis: 85,
    compareAtPriceCedis: 95,
    category: "Soft drinks",
    image: `${IMG}/pepsi-max-8pack.webp`,
    createdAt: 11,
    features: ["No sugar", "8 × 330ml", "Maximum taste"],
  },
  {
    id: "demo-gelatelli-mini-sticks",
    name: "Gelatelli Mini Sticks Double Caramel & Chocolate",
    description:
      "Six mini ice cream sticks with a creamy centre, coated in chocolate and caramel. Rainforest Alliance cocoa. Keep frozen.",
    shortDescription: "6 mini caramel & chocolate ice cream sticks.",
    priceCedis: 95,
    category: "Frozen",
    image: `${IMG}/gelatelli-mini-sticks.webp`,
    createdAt: 10,
    features: ["6 mini sticks", "360ml / 300g", "Keep frozen"],
  },
  {
    id: "demo-naturis-apple-juice",
    name: "Naturis Truly Juicy Apple Juice, 6 × 200ml",
    description:
      "100% apple juice from concentrate in 200ml cartons with paper straws. One carton is 1 of your 5 a day (150ml serving).",
    shortDescription: "100% apple juice, 6 × 200ml cartons.",
    priceCedis: 48,
    category: "Soft drinks",
    image: `${IMG}/naturis-apple-juice.webp`,
    createdAt: 9,
    features: ["100% juice", "6 × 200ml", "Paper straw"],
  },
  {
    id: "demo-cien-after-sun",
    name: "Cien Sun After Sun Aloe Vera Gel",
    description:
      "Cooling after-sun gel with 20% organic aloe vera. Non-greasy, vegan, and made to soothe skin after a day in the sun.",
    shortDescription: "Cooling aloe vera after-sun gel.",
    priceCedis: 55,
    category: "Sun care",
    image: `${IMG}/cien-after-sun.webp`,
    createdAt: 8,
    features: ["20% organic aloe vera", "Non-greasy", "Vegan"],
  },
  {
    id: "demo-stella-artois-18",
    name: "Stella Artois Premium Lager, 18 × 440ml",
    description:
      "Belgian premium lager at 4.6% vol. Eighteen 440ml cans — the Fine de Luxe pack for weekends and gatherings. 18+",
    shortDescription: "Belgian lager, 18 × 440ml cans, 4.6% vol.",
    priceCedis: 285,
    compareAtPriceCedis: 320,
    category: "Beer",
    image: `${IMG}/stella-artois-18.webp`,
    createdAt: 7,
    features: ["18 × 440ml", "4.6% vol", "Belgium"],
  },
  {
    id: "demo-sunrise-passion-fruit",
    name: "Sunrise Passion Fruit Martini, 250ml",
    description:
      "Ready-to-drink passion fruit martini in a slim 250ml can. Nitrogen-infused for a smooth, velvety texture. 5% vol. 18+",
    shortDescription: "RTD passion fruit martini, 250ml, 5% vol.",
    priceCedis: 32,
    category: "Cocktails",
    image: `${IMG}/sunrise-passion-fruit.webp`,
    createdAt: 6,
    features: ["250ml can", "5% vol", "Nitrogen infused"],
  },
  {
    id: "demo-cien-suncare-spf30",
    name: "Cien Sun Suncare Spray SPF 30",
    description:
      "High-protection SPF 30 spray with UVA and UVB filters. Water-resistant, vegan, and hydrating for 24 hours. Easy even coverage.",
    shortDescription: "SPF 30 water-resistant suncare spray.",
    priceCedis: 72,
    category: "Sun care",
    image: `${IMG}/cien-suncare-spf30.webp`,
    createdAt: 5,
    features: ["SPF 30", "Water-resistant", "Vegan"],
  },
  {
    id: "demo-sunrise-strawberry-daiquiri",
    name: "Sunrise Strawberry Daiquiri, 250ml",
    description:
      "Strawberry daiquiri in a slim 250ml can, infused with nitrogen for a velvety pour. 5% vol. Chill and drink. 18+",
    shortDescription: "RTD strawberry daiquiri, 250ml, 5% vol.",
    priceCedis: 32,
    category: "Cocktails",
    image: `${IMG}/sunrise-strawberry-daiquiri.webp`,
    createdAt: 4,
    features: ["250ml can", "5% vol", "Nitrogen infused"],
  },
  {
    id: "demo-monte-plogar",
    name: "Monte Plogar Gran Reserva, 750ml",
    description:
      "Spanish Gran Reserva from Cariñena D.O.P. (Torres de Pica). 13.5% vol, 750ml bottle — a full-bodied red for the table. 18+",
    shortDescription: "Spanish Gran Reserva red, 750ml, 13.5% vol.",
    priceCedis: 165,
    category: "Wine",
    image: `${IMG}/monte-plogar-gran-reserva.webp`,
    createdAt: 3,
    features: ["750ml", "13.5% vol", "Cariñena D.O.P."],
  },
  {
    id: "demo-magnum-classic-6",
    name: "Magnum Classic, 6 pack",
    description:
      "Madagascar vanilla ice cream coated in cracking chocolate. Six bars, sustainably grown cocoa. Keep frozen.",
    shortDescription: "Vanilla ice cream bars with cracking chocolate, ×6.",
    priceCedis: 118,
    compareAtPriceCedis: 135,
    category: "Frozen",
    image: `${IMG}/magnum-classic-6.webp`,
    createdAt: 2,
    features: ["6 bars", "100ml each", "Keep frozen"],
  },
  {
    id: "demo-fosters-lager-18",
    name: "Foster's Lager, 18 cans",
    description:
      "Foster's Amber Nectar lager in an 18-can box. Easy-drinking Australian-style lager for the cooler. 18+",
    shortDescription: "Foster's lager, 18-can multipack.",
    priceCedis: 255,
    category: "Beer",
    image: `${IMG}/fosters-lager-18.webp`,
    createdAt: 1,
    features: ["18 cans", "The Amber Nectar", "Lager"],
  },
];

export const IMPORTS_DEMO_FAQS = [
  {
    question: "How do I pay?",
    answer:
      "Place the order on the site, then send Mobile Money to the number shown on the confirmation screen. The seller marks the order paid once they receive it.",
  },
  {
    question: "Where do you deliver?",
    answer: "Accra usually next day. Other regions typically arrive 2–4 days after dispatch.",
  },
  {
    question: "Are the goods imported?",
    answer: "Yes. This shop is set up for everyday imported groceries priced in Ghana Cedis.",
  },
];

export function getImportsDemoProduct(id: string): ImportsDemoProduct | undefined {
  return IMPORTS_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function importsDemoToProduct(item: ImportsDemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: [item.image],
    stockQuantity: 20,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    features: item.features ?? [],
  };
}
