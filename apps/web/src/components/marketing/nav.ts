import { getDashboardUrl } from "@glamsite/shared/supabase/env";

export const marketingNav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#templates", label: "Templates" },
  { href: "/#who-its-for", label: "Who this is for" },
];

export function sellerOnboardingHref() {
  return `${getDashboardUrl()}/signup-seller`;
}

export function sellerLoginHref() {
  return `${getDashboardUrl()}/login`;
}
