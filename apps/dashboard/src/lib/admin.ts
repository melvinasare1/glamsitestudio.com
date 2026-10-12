import { notFound, redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/seller";

/** Comma-separated emails that can open /dashboard/admin. Fail closed if unset. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<{ uid: string; email: string }> {
  const session = await getDashboardSession();
  if (!session) {
    redirect("/login");
  }
  const email = session.user.email?.trim() ?? "";
  if (!isAdminEmail(email)) {
    notFound();
  }
  return { uid: session.user.uid, email };
}
