import { getDashboardUrl } from "@glamsite/shared/supabase/env";

export const marketingNav = [{ href: "/#templates", label: "Templates" }];

export function ownerSignupHref() {
  return `${getDashboardUrl()}/signup`;
}

export function ownerLoginHref() {
  return `${getDashboardUrl()}/login`;
}
