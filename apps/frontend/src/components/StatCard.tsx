type StatCardProps = {
  label: string;
  value: string;
  delta?: {
    value: string;
    trend: "up" | "down";
  };
};

export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-surface-subtle bg-surface/80 p-4 shadow-md shadow-black/20">
      <p className="text-sm uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-white">{value}</span>
        {delta ? (
          <span
            className={`text-xs font-medium ${
              delta.trend === "up" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {delta.trend === "up" ? "▲" : "▼"} {delta.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
