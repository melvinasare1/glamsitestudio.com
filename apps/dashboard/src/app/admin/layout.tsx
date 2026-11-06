import Link from "next/link";
import { AdminSignOutButton } from "@/components/admin-sign-out-button";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();

  return (
    <div className="min-h-screen bg-mist">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-navy">Glam Site Studios</p>
            <p className="text-xs text-muted-foreground">Admin · {email}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-foreground/80 hover:text-foreground">
              Overview
            </Link>
            <Link href="/admin/earn" className="text-foreground/80 hover:text-foreground">
              Earn referrals
            </Link>
          </nav>
        </div>
        <AdminSignOutButton />
      </header>
      <div className="flex flex-1 flex-col pb-12">{children}</div>
    </div>
  );
}
