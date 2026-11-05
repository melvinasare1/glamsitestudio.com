import { redirect } from "next/navigation";
import { createClient } from "@glamsite/shared/supabase/server";

/** Comma-separated platform-staff logins (docs/infrastructure.md). Dashboard-only, never exposed to clients. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/**
 * Gate for the /admin area. Platform staff don't have a business of their
 * own, so this checks ADMIN_EMAILS directly rather than going through
 * ownerContext()/requireBusiness(). Every cross-business query on these
 * pages still only runs after this passes.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");
  return { email: user.email as string };
}
