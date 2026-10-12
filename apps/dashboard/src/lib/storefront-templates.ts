import { templateHasBlog, type StorefrontTemplate } from "@glamsite/shared/types";

export const STOREFRONT_TEMPLATE_OPTIONS: Array<{
  id: StorefrontTemplate;
  name: string;
  description: string;
  previewClass: string;
  /** Same screenshots as the marketing homepage, when available. */
  previewImage?: string;
}> = [
  {
    id: "template-a",
    name: "Studio",
    description: "Minimal boutique layout, for fashion and beauty sellers.",
    previewClass: "bg-gradient-to-br from-zinc-100 via-white to-orange-100",
    previewImage: "/marketing/simple-preview.jpg",
  },
  {
    id: "sneaker-template",
    name: "Kicks",
    description: "Warm sneaker storefront, for footwear and streetwear sellers.",
    previewClass: "bg-gradient-to-br from-[#F5F0EA] via-[#E8E2D9] to-[#3C2415]",
    previewImage: "/marketing/kicks-preview.png",
  },
  {
    id: "kitchenware-template",
    name: "Kitchenware",
    description: "Warm editorial layout, for home and kitchen goods.",
    previewClass: "bg-gradient-to-br from-emerald-50 via-stone-100 to-amber-100",
    previewImage: "/marketing/kitchenware-preview.jpg",
  },
  {
    id: "motorbike-template",
    name: "Ride",
    description: "Dark vehicle-retail layout, for motorbikes, bicycles, mopeds, and scooters.",
    previewClass: "bg-gradient-to-br from-neutral-950 via-neutral-800 to-orange-700",
    previewImage: "/marketing/ride-preview.jpg",
  },
  {
    id: "imports-template",
    name: "Imports",
    description: "Blue catalogue layout, for grocery and everyday imported goods.",
    previewClass: "bg-gradient-to-br from-[#e8f1fa] via-white to-[#1266b5]",
    previewImage: "/marketing/imports-preview.jpg",
  },
  {
    id: "hair-beauty-template",
    name: "Hair & Beauty",
    description: "Warm luxury layout, for wigs, bundles, and hair retailers.",
    previewClass: "bg-gradient-to-br from-[#f7f1df] via-[#c4b896] to-[#8a8165]",
    previewImage: "/marketing/hair-beauty-preview.jpg",
  },
];

export const PRODUCT_CATEGORY_SUGGESTIONS = [
  "Fashion",
  "Beauty & cosmetics",
  "Phone accessories",
  "Home goods",
  "Baby items",
  "Stationery",
] as const;

export const WEBSITE_ADMIN_FEATURES = [
  "Storefront on your own domain",
  "Pick from 6 templates",
  "Admin dashboard for orders, products, and sales",
  "Manual MoMo payments. You mark orders paid, unpaid, or cancelled",
  "Email support",
] as const;

export const FULFILMENT_FEATURES = [
  "Everything in Website & Admin",
  "We store your stock",
  "We pack and dispatch every order",
  "Photo proof at intake and before dispatch",
  "Priority support",
] as const;

export function templateLabel(id: StorefrontTemplate): string {
  return STOREFRONT_TEMPLATE_OPTIONS.find((option) => option.id === id)?.name ?? id;
}

export { templateHasBlog };
