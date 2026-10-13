import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardSession } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");

  if (!session.business) {
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

  return (
    <DashboardShell user={session.user} business={session.business}>
      {children}
    </DashboardShell>
  );
}
