import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={16} className="text-[var(--muted)]" />}
      </div>
      <div className="stat-value">{value}</div>
      {(sub || trend) && (
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          {trend && <span className="text-[var(--success)]">{trend} </span>}
          {sub}
        </p>
      )}
    </div>
  );
}
