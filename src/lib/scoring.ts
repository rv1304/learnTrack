import { listTopics } from "./db";
import type { LeetCodeStats } from "./leetcode";
import type { GitHubStats } from "./github";
import { PILLARS } from "./pillars";

export interface ScoreBreakdown {
  learning: number;
  leetcode: number;
  github: number;
  pillars: Record<string, number>;
  total: number;
}

export function calculateLearningScore(): { score: number; pillars: Record<string, number> } {
  const topics = listTopics();
  const pillars: Record<string, number> = {};
  for (const p of PILLARS) pillars[p.id] = 0;

  for (const t of topics) {
    const base = t.status === "done" ? 10 : t.status === "in_progress" ? 5 : 1;
    const hourBonus = Math.min(t.hours * 2, 20);
    pillars[t.pillar_id] = (pillars[t.pillar_id] ?? 0) + base + hourBonus;
  }

  const pillarScores = Object.values(pillars);
  const avg = pillarScores.length ? pillarScores.reduce((a, b) => a + b, 0) / pillarScores.length : 0;
  const coverage = pillarScores.filter((s) => s > 0).length / PILLARS.length;
  const score = Math.min(100, Math.round(avg * 0.6 + coverage * 40));

  return { score, pillars };
}

export function calculateLeetCodeScore(stats: LeetCodeStats | null): number {
  if (!stats) return 0;
  return Math.min(
    100,
    Math.round(
      stats.easy * 0.5 +
        stats.medium * 2 +
        stats.hard * 5 +
        Math.min(stats.totalSubmissions * 0.05, 15)
    )
  );
}

export function calculateTotalScore(
  learning: { score: number; pillars: Record<string, number> },
  leetcode: LeetCodeStats | null,
  github: GitHubStats | null
): ScoreBreakdown {
  const lcScore = calculateLeetCodeScore(leetcode);
  const ghScore = github?.score ?? 0;
  const total = Math.round(learning.score * 0.4 + lcScore * 0.35 + ghScore * 0.25);

  return {
    learning: learning.score,
    leetcode: lcScore,
    github: ghScore,
    pillars: learning.pillars,
    total: Math.min(100, total),
  };
}
