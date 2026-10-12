import clsx from "clsx";

export default function StatCard({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-wire bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-ink-700/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink-950 font-tabular">
        {value}
      </p>
      {delta && (
        <p
          className={clsx(
            "mt-1 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
