import type { Product, ProductCondition } from "@glamsite/shared/types";

import { sellerSlugFromPath, storefrontBase } from "@/lib/store-path";

export const RIDE_TEMPLATE_BASE = "/store/motorbike-template";

export type RideDemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCedis: number;
  compareAtPriceCedis?: number;
  shortDescription?: string;
  category: string;
  createdAt: number;
  image: string;
  gallery?: string[];
  colors: string[];
  rating?: number;
  features?: string[];
  tags?: string[];
  engineSize?: string;
  condition?: ProductCondition;
  year?: number;
  filterColours?: string[];
};

const IMAGES = {
  motorbike: "/store/motorbike-template/motorbike.png",
  moped: "/store/motorbike-template/moped.png",
  classic: "/store/motorbike-template/classic.png",
  ebike: "/store/motorbike-template/ebike.png",
  helmet: "/store/motorbike-template/helmet.png",
  jacket: "/store/motorbike-template/jacket.png",
  gloves: "/store/motorbike-template/gloves.png",
  gopro: "/store/motorbike-template/gopro.png",
  trousers: "/store/motorbike-template/trousers.png",
  boots: "/store/motorbike-template/boots.png",
} as const;

export const RIDE_DEMO_VEHICLES: RideDemoProduct[] = [
  {
    id: "demo-motorbike-1",
    name: "Apex R9",
    description:
      "Street-ready motorbike with a punchy engine, upright seating, and the range to cover town and the open road.",
    shortDescription: "Street-ready commuter with town and open-road range.",
    priceCedis: 18900,
    compareAtPriceCedis: 21400,
    category: "Motorbikes",
    createdAt: 4,
    image: IMAGES.motorbike,
    gallery: [IMAGES.moped, IMAGES.classic],
    colors: ["#111111", "#E8622C"],
    features: ["Upright seating", "Town and open-road range", "Punchy street engine"],
    tags: ["Sport", "Commuter"],
    engineSize: "650cc",
    condition: "new",
    year: 2025,
    filterColours: ["Black", "Orange"],
  },
  {
    id: "demo-bicycle-1",
    name: "City E-Bike",
    description:
      "Quiet power for city hops and weekend loops. A removable battery, disc brakes, and a ride that stays composed in traffic.",
    priceCedis: 9450,
    category: "Bicycles",
    createdAt: 3,
    image: IMAGES.ebike,
    gallery: [IMAGES.classic, IMAGES.motorbike],
    colors: ["#111111", "#FFFFFF"],
    features: ["Removable battery", "Disc brakes", "Composed in traffic"],
    tags: ["Electric", "Commuter"],
    engineSize: "Electric",
    condition: "new",
    year: 2025,
    filterColours: ["Black", "White"],
  },
  {
    id: "demo-moped-1",
    name: "Urban Moped",
    description:
      "A compact commuter for short trips and tight streets. Light, easy to park, and ready for daily errands.",
    priceCedis: 6200,
    category: "Mopeds",
    createdAt: 2,
    image: IMAGES.moped,
    gallery: [IMAGES.classic, IMAGES.ebike],
    colors: ["#111111", "#ADB5BD"],
    features: ["Light and easy to park", "Tight-street commuter", "Daily errands"],
    tags: ["Commuter"],
    engineSize: "50cc",
    condition: "used",
    year: 2023,
    filterColours: ["Black", "Grey"],
  },
  {
    id: "demo-scooter-1",
    name: "Classic Scooter",
    description:
      "A simple, stylish scooter for neighborhood runs, with a step-through frame, under-seat storage, and an easy sit-up ride.",
    priceCedis: 4800,
    category: "Scooters",
    createdAt: 1,
    image: IMAGES.classic,
    gallery: [IMAGES.moped, IMAGES.ebike],
    colors: ["#111111", "#FFFFFF"],
    features: ["Step-through frame", "Under-seat storage", "Easy sit-up ride"],
    tags: ["Commuter"],
    engineSize: "125cc",
    condition: "new",
    year: 2024,
    filterColours: ["Black", "White"],
  },
];

export const RIDE_DEMO_ACCESSORIES: RideDemoProduct[] = [
  {
    id: "demo-helmet",
    name: "Motorbike Helmet",
    description: "Full-face helmet with a wide visor and a secure fit for daily commuting and weekend rides.",
    priceCedis: 450,
    category: "Helmets",
    createdAt: 10,
    image: IMAGES.helmet,
    colors: ["#111111", "#3A3A3A"],
    gallery: [IMAGES.jacket, IMAGES.gopro],
    rating: 5,
    features: ["Full-face shell", "Wide visor", "Secure daily fit"],
    tags: ["Gear"],
    condition: "new",
    year: 2024,
    filterColours: ["Black"],
  },
  {
    id: "demo-jacket",
    name: "Motorbike Jacket",
    description: "Armored riding jacket with a weather-ready shell and a cut that stays comfortable on longer rides.",
    priceCedis: 890,
    category: "Jackets",
    createdAt: 9,
    image: IMAGES.jacket,
    colors: ["#111111", "#FFFFFF", "#C0392B"],
    gallery: [IMAGES.trousers, IMAGES.gloves],
    rating: 5,
    features: ["Armor-ready shell", "Weather-ready", "Comfortable on longer rides"],
    tags: ["Gear"],
    condition: "new",
    year: 2024,
    filterColours: ["Black", "White", "Red"],
  },
  {
    id: "demo-gloves",
    name: "Motorbike Gloves",
    description: "Protective riding gloves with palm grip and knuckle coverage for control in all weather.",
    priceCedis: 95,
    category: "Gloves",
    createdAt: 8,
    image: IMAGES.gloves,
    colors: ["#111111", "#ADB5BD"],
    gallery: [IMAGES.jacket, IMAGES.boots],
    rating: 4,
    features: ["Palm grip", "Knuckle coverage", "All-weather control"],
    tags: ["Gear"],
    condition: "new",
    year: 2023,
    filterColours: ["Black", "Grey"],
  },
  {
    id: "demo-gopro",
    name: "Go Pro Camera",
    description: "A compact action camera for recording street rides, trail days, and workshop setups.",
    priceCedis: 720,
    category: "Accessories",
    createdAt: 7,
    image: IMAGES.gopro,
    colors: ["#111111", "#3B82F6"],
    gallery: [IMAGES.helmet, IMAGES.motorbike],
    rating: 5,
    features: ["Compact action cam", "Street and trail", "Workshop setups"],
    tags: ["Gear"],
    condition: "new",
    year: 2025,
    filterColours: ["Black"],
  },
  {
    id: "demo-trousers",
    name: "Motorbike Trousers",
    description: "Reinforced riding trousers with stretch panels and armor pockets for commuting and touring.",
    priceCedis: 640,
    category: "Trousers",
    createdAt: 6,
    image: IMAGES.trousers,
    colors: ["#111111", "#FFFFFF"],
    gallery: [IMAGES.jacket, IMAGES.boots],
    rating: 4,
    features: ["Reinforced panels", "Stretch for commuting", "Armor pockets"],
    tags: ["Gear"],
    condition: "used",
    year: 2022,
    filterColours: ["Black", "White"],
  },
  {
    id: "demo-boots",
    name: "Motorbike Boots",
    description: "Sturdy riding boots with ankle support and a sole that grips wet pavement and pegs.",
    priceCedis: 380,
    category: "Boots",
    createdAt: 5,
    image: IMAGES.boots,
    colors: ["#111111", "#FFFFFF"],
    gallery: [IMAGES.trousers, IMAGES.gloves],
    rating: 4,
    features: ["Ankle support", "Grips wet pavement", "Sturdy touring sole"],
    tags: ["Gear"],
    condition: "new",
    year: 2024,
    filterColours: ["Black", "White"],
  },
];

export const RIDE_DEMO_FILTER_FACETS = {
  tags: ["Commuter", "Sport", "Adventure", "Electric", "Gear"],
  engineSizes: ["50cc", "125cc", "250cc", "400cc", "650cc", "Electric"],
  colours: ["Black", "White", "Orange", "Grey", "Red"],
  years: [2022, 2023, 2024, 2025, 2026],
};

export const RIDE_DEMO_PRODUCTS: RideDemoProduct[] = [
  ...RIDE_DEMO_VEHICLES,
  ...RIDE_DEMO_ACCESSORIES,
];

export const RIDE_DEMO_FAQS = [
  {
    question: "Do you deliver bikes assembled?",
    answer: "Yes. Vehicles arrive inspected and ride-ready. Accessories ship packed for the trip.",
  },
  {
    question: "Can I test ride before buying?",
    answer: "Book a slot after checkout confirmation. We'll match you to the model you ordered.",
  },
  {
    question: "What's covered on first service?",
    answer: "First service is included on vehicles. Bring your ANS- order number when you come in.",
  },
];

export function getRideDemoProduct(id: string): RideDemoProduct | undefined {
  return RIDE_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function isRideDemoProductId(id: string): boolean {
  return Boolean(getRideDemoProduct(id));
}

/** Preview-only MoMo number for the dummy Ride catalog. */
export const RIDE_DEMO_MOMO_NUMBER = "0240000000";

export function rideDemoToProduct(item: RideDemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: [item.image, ...(item.gallery ?? [])].filter(Boolean),
    features: item.features,
    stockQuantity: 8,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    colors: item.colors,
    tags: item.tags,
    engineSize: item.engineSize,
    condition: item.condition,
    year: item.year,
  };
}

export function rideStoreBase(sellerSlug?: string): string {
  return storefrontBase("motorbike-template", sellerSlug);
}

export function rideProductPath(productId: string, sellerSlug?: string): string {
  return `${rideStoreBase(sellerSlug)}/product/${productId}`;
}

export function rideCartPath(sellerSlug?: string): string {
  return `${rideStoreBase(sellerSlug)}/cart`;
}

export function rideCartHrefFromPath(pathname: string): string {
  return rideCartPath(sellerSlugFromPath(pathname, "motorbike-template"));
}
