/**
 * Seed a sample Styleco seller + products so template-a can be tested end to end.
 *
 * Usage (from repo root, with NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local, apps/dashboard/.env.local,
 * or a root .env.local):
 *   npm run seed:storefront
 *
 * Then open: http://localhost:3000/store/template-a
 *
 * Run supabase/migrations/20260827120000_init.sql first.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELLER_ID = "11111111-1111-4111-8111-111111111111";
const STORE_SLUG = "styleco";

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadEnvLocal() {
  for (const envPath of [
    join(root, "apps/web/.env.local"),
    join(root, "apps/dashboard/.env.local"),
    join(root, ".env.local"),
  ]) {
    loadEnvFile(envPath);
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local.example)."
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const seller = {
  id: SELLER_ID,
  uid: SELLER_ID,
  business_name: "Store",
  domain: "styleco.local",
  store_slug: STORE_SLUG,
  template: "template-a",
  email: "styleco@example.com",
  phone: "+233000000000",
  pricing_tier: "website_admin",
  base_fee_cedis: 250,
  status: "active",
  subscription_status: "active",
};

const SHIRT_IMAGES = [
  "https://ztoogyrvfghfoizahygf.supabase.co/storage/v1/object/public/product-images/template%20a%20images/ChatGPT%20Image%20Aug%2030,%202026,%2009_24_54%20PM.png",
  "https://ztoogyrvfghfoizahygf.supabase.co/storage/v1/object/public/product-images/template%20a%20images/ChatGPT%20Image%20Aug%2030,%202026,%2009_27_34%20PM.png",
  "https://ztoogyrvfghfoizahygf.supabase.co/storage/v1/object/public/product-images/template%20a%20images/ChatGPT%20Image%20Aug%2030,%202026,%2009_32_46%20PM.png",
  "https://ztoogyrvfghfoizahygf.supabase.co/storage/v1/object/public/product-images/template%20a%20images/ChatGPT%20Image%20Aug%2030,%202026,%2009_35_12%20PM.png",
];

const products = [
  {
    id: "21111111-1111-4111-8111-111111111111",
    seller_id: SELLER_ID,
    name: "Split Panel Shirt",
    description:
      "A short-sleeve button-up with a split print: orange stripes on one side and a floral panel on the other.",
    short_description: "Split-print camp shirt for warm days.",
    price_cedis: 130,
    compare_at_price_cedis: 165,
    images: [SHIRT_IMAGES[0]],
    stock_quantity: 24,
    sku: "STY-SHIRT-001",
    category: "Tops & Tees",
    active: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Orange", "Cream", "Black"],
  },
  {
    id: "21111111-1111-4111-8111-111111111112",
    seller_id: SELLER_ID,
    name: "Tropical Floral Shirt",
    description: "Open-collar short sleeve with a tropical lily print on a pale blue ground. Light enough for warm days.",
    price_cedis: 245,
    images: [SHIRT_IMAGES[1]],
    stock_quantity: 18,
    sku: "STY-SHIRT-002",
    category: "Tops & Tees",
    active: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Blue", "Orange", "White"],
  },
  {
    id: "21111111-1111-4111-8111-111111111113",
    seller_id: SELLER_ID,
    name: "Painterly Stripe Shirt",
    description: "A camp shirt in painterly vertical stripes — cyan, gold, magenta, and black on a light ground.",
    price_cedis: 180,
    images: [SHIRT_IMAGES[2]],
    stock_quantity: 12,
    sku: "STY-SHIRT-003",
    category: "Tops & Tees",
    active: true,
    sizes: ["S", "M", "L"],
    colors: ["Blue", "Yellow", "Orange"],
  },
  {
    id: "21111111-1111-4111-8111-111111111114",
    seller_id: SELLER_ID,
    name: "Graphic Print Shirt",
    description: "A teal short-sleeve covered in collage graphics and slogans. Loud on purpose.",
    price_cedis: 220,
    images: [SHIRT_IMAGES[3]],
    stock_quantity: 16,
    sku: "STY-SHIRT-004",
    category: "Tops & Tees",
    active: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Sky", "Green", "Orange"],
  },
];

const { error: sellerError } = await supabase.from("sellers").upsert(seller, { onConflict: "id" });
if (sellerError) throw sellerError;

const { error: productError } = await supabase.from("products").upsert(products, { onConflict: "id" });
if (productError) throw productError;

const keepIds = products.map((product) => product.id);
const { error: cleanupError } = await supabase
  .from("products")
  .delete()
  .eq("seller_id", SELLER_ID)
  .not("id", "in", `(${keepIds.join(",")})`);
if (cleanupError) throw cleanupError;

console.log(`Seeded seller "${STORE_SLUG}" (${SELLER_ID}) with ${products.length} products.`);
console.log(`Visit: http://localhost:3000/store/template-a/${STORE_SLUG}`);
