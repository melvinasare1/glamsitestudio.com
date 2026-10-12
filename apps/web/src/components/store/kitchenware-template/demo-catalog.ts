import type { Product } from "@glamsite/shared/types";

export const KITCHENWARE_TEMPLATE_BASE = "/store/kitchenware-template";

export type KitchenwareDemoProduct = {
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
  features?: string[];
};

export const KITCHENWARE_DEMO_PRODUCTS: KitchenwareDemoProduct[] = [
  {
    id: "demo-stoneware-mug",
    name: "CupEco Stoneware Mug",
    description: "A weighty mug with a matte glaze. Holds a generous pour and stacks neatly.",
    shortDescription: "Matte stoneware mug for everyday pours.",
    priceCedis: 95,
    compareAtPriceCedis: 120,
    category: "Drinkware",
    createdAt: 6,
    image: "/template-c/cups.jpg",
    gallery: ["/template-c/glasses.jpg", "/template-c/bottle.jpg"],
    colors: ["#EDE8DC", "#2B4239", "#C4B89A"],
    features: ["Matte glaze", "Generous pour", "Stacks neatly"],
  },
  {
    id: "demo-casserole",
    name: "Grove Casserole",
    description: "Even-heat casserole for weeknight stews. Oven-safe lid and a handle that stays cool enough to lift.",
    priceCedis: 340,
    category: "Cookware",
    createdAt: 5,
    image: "/template-c/pots.jpg",
    gallery: ["/template-c/kettle.jpg", "/template-c/utensils.jpg"],
    colors: ["#3D5348", "#C08A4D"],
    features: ["Even heat", "Oven-safe lid", "Hob to table"],
  },
  {
    id: "demo-carafe",
    name: "NatureSip Carafe",
    description: "Clear glass carafe for water or juice. Narrow neck, wide base, and a pour that does not drip.",
    priceCedis: 160,
    category: "Drinkware",
    createdAt: 4,
    image: "/template-c/bottle.jpg",
    gallery: ["/template-c/glasses.jpg", "/template-c/cups.jpg"],
    colors: ["#F5F1E4", "#2B4239"],
    features: ["Clear glass", "Drip-free pour", "Wide base"],
  },
  {
    id: "demo-kettle",
    name: "Forest Kettle",
    description: "Stovetop kettle with a quiet whistle. Ceramic body that looks at home on the table.",
    priceCedis: 220,
    category: "Cookware",
    createdAt: 3,
    image: "/template-c/kettle.jpg",
    gallery: ["/template-c/pots.jpg", "/template-c/editorial.jpg"],
    colors: ["#2B4239", "#EDE8DC"],
    features: ["Quiet whistle", "Stovetop safe", "Ceramic body"],
  },
  {
    id: "demo-serving-board",
    name: "Grove Serving Board",
    description: "Oil-finished wood board for bread, cheese, or a Sunday spread. Deep juice groove.",
    priceCedis: 185,
    category: "Serve",
    createdAt: 2,
    image: "/template-c/bowls.jpg",
    gallery: ["/template-c/boards.jpg", "/template-c/utensils.jpg"],
    colors: ["#C08A4D", "#3D5348"],
    features: ["Oil-finished wood", "Juice groove", "Sunday spread size"],
  },
  {
    id: "demo-utensil-set",
    name: "StirWell Utensil Set",
    description: "Wooden spoon, spatula, and ladle in a matching grain. Safe on non-stick pans.",
    priceCedis: 110,
    category: "Tools",
    createdAt: 1,
    image: "/template-c/utensils.jpg",
    gallery: ["/template-c/boards.jpg", "/template-c/pots.jpg"],
    colors: ["#C08A4D", "#111111"],
    features: ["Matching grain", "Non-stick safe", "Spoon, spatula, ladle"],
  },
];

export const KITCHENWARE_DEMO_FAQS = [
  {
    question: "Are the pieces dishwasher safe?",
    answer: "Stoneware and glass can go on the top rack. Wooden boards and utensils should be hand-washed and oiled.",
  },
  {
    question: "How do you pack ceramics?",
    answer: "Each piece is wrapped and photographed before it leaves so chips in transit are rare and easy to prove.",
  },
  {
    question: "Do you ship outside Accra?",
    answer: "Yes. Accra usually next day; other regions take 2–4 days after dispatch.",
  },
];

export function getKitchenwareDemoProduct(id: string): KitchenwareDemoProduct | undefined {
  return KITCHENWARE_DEMO_PRODUCTS.find((item) => item.id === id);
}

export function kitchenwareDemoToProduct(item: KitchenwareDemoProduct): Product {
  return {
    id: item.id,
    sellerId: "demo",
    name: item.name,
    description: item.description,
    shortDescription: item.shortDescription,
    priceCedis: item.priceCedis,
    compareAtPriceCedis: item.compareAtPriceCedis,
    images: [item.image, ...(item.gallery ?? [])].filter(Boolean),
    stockQuantity: 10,
    sku: item.id.replace(/-/g, "").toUpperCase(),
    category: item.category,
    active: true,
    createdAt: item.createdAt,
    colors: item.colors,
    features: item.features ?? [],
    variants: item.colors.length
      ? [
          {
            id: `${item.id}-color`,
            name: "Color",
            values: item.colors,
            sku: `${item.id.replace(/-/g, "").toUpperCase()}-CLR`,
            priceCedis: item.priceCedis,
            stockQuantity: 10,
            images: [],
            imagesByValue: Object.fromEntries(
              item.colors.map((color, index) => {
                const urls = [item.image, ...(item.gallery ?? [])].filter(Boolean);
                return [color, [urls[index % urls.length]]];
              })
            ),
          },
        ]
      : undefined,
  };
}
