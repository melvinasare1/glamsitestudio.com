import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isAdminEmail } from "@/lib/admin";
import { ansaaMomoDetails } from "@/lib/billing";
import { getDashboardSession } from "@/lib/seller";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={session.user}
      seller={session.seller}
      sellerError={session.sellerError}
      isAdmin={isAdminEmail(session.user.email)}
      trialEndsAt={session.seller?.trialEndsAt ?? null}
      subscriptionStatus={session.seller?.subscriptionStatus ?? null}
      momo={ansaaMomoDetails()}
    >
      {children}
    </DashboardShell>
  );
}
