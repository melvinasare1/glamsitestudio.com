import { getDashboardUrl } from "@glamsite/shared/supabase/env";

export const marketingNav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#templates", label: "Templates" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function ownerSignupHref() {
  return `${getDashboardUrl()}/signup`;
}

export function ownerLoginHref() {
  return `${getDashboardUrl()}/login`;
}
