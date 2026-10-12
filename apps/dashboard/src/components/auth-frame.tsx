export const AUTH_INPUT_CLASS =
  "mt-1.5 w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-muted-foreground focus:border-navy";

export function AuthFrame({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-mist px-6 py-12 text-ink-950 md:py-16">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-navy">{kicker}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">{title}</h1>
        {description ? <p className="mt-2 text-sm text-ink-700">{description}</p> : null}
        {children}
      </div>
    </main>
  );
}
