import {
  PRICING_TIER_BASE_FEE_CEDIS,
  type PricingTier,
  type Seller,
} from "@glamsite/shared/types";

export const PLAN_LABELS: Record<PricingTier, string> = {
  website_admin: "Website & Admin",
  fulfilment: "Fulfilment",
};

export const SELLER_STATUS_LABELS: Record<Seller["status"], string> = {
  onboarding: "Onboarding — pending review",
  active: "Active",
  paused: "Paused",
  offboarded: "Offboarded",
};

export function sellerPlanLabel(seller: Pick<Seller, "pricingTier" | "baseFeeCedis">): string {
  const name = PLAN_LABELS[seller.pricingTier];
  const price = seller.baseFeeCedis || PRICING_TIER_BASE_FEE_CEDIS[seller.pricingTier];
  return `${name} · ${price} GHS/mo`;
}

export type AnsaaMomoDetails = {
  number: string;
  accountName: string;
  configured: boolean;
};

export function ansaaMomoDetails(): AnsaaMomoDetails {
  const number = (process.env.ANSAA_MOMO_NUMBER ?? "").trim();
  const accountName = (process.env.ANSAA_MOMO_ACCOUNT_NAME ?? "").trim() || "Glam Site Studios";
  return {
    number: number || "Not configured yet",
    accountName,
    configured: Boolean(number),
  };
}
