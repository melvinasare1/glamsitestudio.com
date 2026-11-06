import { redirect } from "next/navigation";
import Script from "next/script";
import { AuthFrame } from "@/components/auth-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@glamsite/shared/supabase/server";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import { isAdminEmail } from "@/lib/admin";
import { getDashboardSession } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  if (!session.business) {
    if (isAdminEmail(session.user.email)) redirect("/admin");

    return (
      <AuthFrame kicker="Glam Site Studios" title="Your site isn't set up yet">
        <p className="mt-6 text-sm text-ink-700">
          You&apos;re signed in as {session.user.email}, but there&apos;s no website linked to this account. If you
          bought a template, contact us and we&apos;ll connect it. Otherwise, start from the{" "}
          <a href="/signup" className="font-medium underline underline-offset-4">
            sign-up page
          </a>
          .
        </p>
      </AuthFrame>
    );
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", session.business.id)
    .eq("status", "pending")
    .gte("starts_at", new Date().toISOString());

  return (
    <DashboardShell user={session.user} business={session.business} pendingCount={count ?? 0} webUrl={getWebUrl()}>
      {children}
      {/* Live chat support. Tidio for now — revisit once volume justifies a cheaper provider
          (docs/follow-ups.md). Only loaded once an owner is signed in with a site, not on
          login/signup/reset-password. */}
      <Script src="https://code.tidio.co/u2xn0hjro3vpvokct80evnxhsmqt8qib.js" strategy="afterInteractive" async />
    </DashboardShell>
  );
}
