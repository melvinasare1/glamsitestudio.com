import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown instantly while a page under the dashboard loads its data (Next
 * renders this as a Suspense fallback the moment navigation starts, so
 * clicking a sidebar link doesn't look like nothing happened).
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <div className="grid gap-6">
        {[0, 1].map((panel) => (
          <div key={panel} className="rounded-2xl border border-black/5 bg-white p-5 shadow-card md:p-6">
            <Skeleton className="mb-5 h-5 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
