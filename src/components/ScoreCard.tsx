"use client";

interface Breakdown {
  total: number;
  learning: number;
  leetcode: number;
  github: number;
}

export function ScoreCard({ breakdown }: { breakdown: Breakdown | null }) {
  if (!breakdown) {
    return (
      <div className="card flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-[var(--muted)]">Connect accounts in Settings</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Then sync to calculate score</p>
      </div>
    );
  }

  const items = [
    { label: "Learning", value: breakdown.learning, weight: "40%" },
    { label: "LeetCode", value: breakdown.leetcode, weight: "35%" },
    { label: "GitHub", value: breakdown.github, weight: "25%" },
  ];

  return (
    <div className="card h-full p-6">
      <p className="section-title">Score Breakdown</p>
      <div className="space-y-4">
        {items.map(({ label, value, weight }, i) => (
          <div key={label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm text-[var(--muted-light)]">{label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tabular-nums">{value}</span>
                <span className="text-[10px] text-[var(--muted)]">{weight}</span>
              </div>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${value}%`, opacity: 0.9 - i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
