import { sellerToInsert } from "@glamsite/shared/mappers";
import { PRICING_TIER_BASE_FEE_CEDIS, type PricingTier, type Seller } from "@glamsite/shared/types";
import { trialEndsAtFromNow } from "@/lib/trial";

export function newSellerInsertRow(input: {
  userId: string;
  businessName: string;
  storeSlug: string;
  email: string;
  phone: string;
  momoPhone: string;
  template: Seller["template"];
  pricingTier: PricingTier;
}) {
  return sellerToInsert({
    id: input.userId,
    uid: input.userId,
    businessName: input.businessName,
    domain: null,
    domainType: "subdomain",
    domainVerified: false,
    storeSlug: input.storeSlug,
    template: input.template,
    email: input.email,
    phone: input.phone,
    momoPhone: input.momoPhone,
    pricingTier: input.pricingTier,
    baseFeeCedis: PRICING_TIER_BASE_FEE_CEDIS[input.pricingTier],
    status: "onboarding",
    createdAt: Date.now(),
    trialEndsAt: trialEndsAtFromNow(),
    subscriptionStatus: "trialing",
    hasBusinessRegistration: false,
    returnPolicy: "",
    storeContent: {},
    faqs: [],
  });
}
