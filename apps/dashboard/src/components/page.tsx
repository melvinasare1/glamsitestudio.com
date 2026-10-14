import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Title row for a dashboard page. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-start sm:justify-between lg:px-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex max-w-5xl flex-col gap-6 px-4 py-6 lg:px-6", className)}>{children}</div>;
}

/** White card used for each block of a page. */
export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-black/5 bg-white p-5 shadow-card md:p-6", className)}>
      {title || actions ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Label, optional help text and a control. */
export function Field({
  id,
  label,
  description,
  error,
  className,
  children,
}: {
  id?: string;
  label: string;
  description?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-2 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
