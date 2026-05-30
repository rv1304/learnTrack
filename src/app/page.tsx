"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Code2, GitBranch, Clock, Target, ArrowRight } from "lucide-react";
import { ScoreCard } from "@/components/ScoreCard";
import { ImprovementChart } from "@/components/ImprovementChart";
import { DailyNotification } from "@/components/DailyNotification";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuickAdd } from "@/components/QuickAdd";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PILLARS } from "@/lib/pillars";
import { format, startOfWeek } from "date-fns";

interface Breakdown {
  total: number;
  learning: number;
  leetcode: number;
  github: number;
}

interface Topic {
  id: string;
  pillar_id: string;
  title: string;
  status: string;
  hours: number;
  updated_at: string;
}

interface Goal {
  pillar_id: string;
  goal: string;
  target_hours: number;
  done: boolean;
}

export default function DashboardPage() {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [history, setHistory] = useState<
    { date: string; total: number; learning?: number; leetcode?: number; github?: number }[]
  >([]);
  const [leetcode, setLeetcode] = useState<{
    totalSolved: number;
    totalSubmissions: number;
    easy: number;
    medium: number;
    hard: number;
  } | null>(null);
  const [github, setGithub] = useState<{
    contributionsThisYear: number;
    totalStars: number;
    publicRepos: number;
    score: number;
  } | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadTopics = () =>
    fetch("/api/topics")
      .then((r) => r.json())
      .then(setTopics);

  const loadWeekly = () => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    fetch("/api/weekly")
      .then((r) => r.json())
      .then((plans) => {
        const current = plans.find((p: { week_start: string }) => p.week_start === weekStart);
        setWeeklyGoals(current ? JSON.parse(current.goals) : []);
      });
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [scoreRes, lcRes, ghRes] = await Promise.all([
        fetch("/api/scores", { method: "POST" }),
        fetch("/api/sync/leetcode"),
        fetch("/api/sync/github"),
      ]);
      const scoreData = await scoreRes.json();
      setBreakdown(scoreData.breakdown);
      setHistory(
        (scoreData.history ?? []).map(
          (h: { date: string; total_score?: number; breakdown: string | Breakdown }) => {
            const b = typeof h.breakdown === "string" ? JSON.parse(h.breakdown) : h.breakdown;
            return {
              date: h.date,
              total: h.total_score ?? b?.total ?? 0,
              learning: b?.learning,
              leetcode: b?.leetcode,
              github: b?.github,
            };
          }
        )
      );
      const lc = await lcRes.json();
      if (lc && !lc.error) setLeetcode(lc);
      const gh = await ghRes.json();
      if (gh && !gh.error) setGithub(gh);
      setLastSync(new Date().toLocaleTimeString());
      await loadTopics();
      loadWeekly();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
    loadWeekly();
    fetch("/api/scores")
      .then((r) => r.json())
      .then((h) => {
        if (Array.isArray(h) && h.length) {
          const last = h[h.length - 1];
          setBreakdown(last.breakdown);
          setHistory(
            h.map((row: { date: string; total: number; breakdown: Breakdown }) => ({
              date: row.date,
              total: row.total,
              learning: row.breakdown?.learning,
              leetcode: row.breakdown?.leetcode,
              github: row.breakdown?.github,
            }))
          );
        }
      });
    fetch("/api/sync/leetcode")
      .then((r) => r.json())
      .then((lc) => {
        if (lc && !lc.error) setLeetcode(lc);
      });
    fetch("/api/sync/github")
      .then((r) => r.json())
      .then((gh) => {
        if (gh && !gh.error) setGithub(gh);
      });
  }, []);

  const totalHours = topics.reduce((s, t) => s + t.hours, 0);
  const doneCount = topics.filter((t) => t.status === "done").length;
  const inProgress = topics.filter((t) => t.status === "in_progress");
  const weeklyDone = weeklyGoals.filter((g) => g.done).length;

  const pillarStats = PILLARS.map((p) => {
    const pts = topics.filter((t) => t.pillar_id === p.id);
    const done = pts.filter((t) => t.status === "done").length;
    const pct = pts.length ? Math.round((done / pts.length) * 100) : 0;
    return { ...p, total: pts.length, done, pct };
  });

  const recentTopics = [...topics]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          lastSync
            ? `Last synced ${lastSync}`
            : "Track progress across all 8 pillars"
        }
        actions={
          <>
            <QuickAdd onAdded={loadTopics} />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="btn btn-secondary w-full sm:w-auto"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Sync All
            </button>
          </>
        }
      />

      <DailyNotification />

      {/* Hero metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="card flex flex-col items-center justify-center p-6 sm:p-8 sm:col-span-2 lg:col-span-3">
          <ProgressRing value={breakdown?.total ?? 0} label="Score" size={100} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:col-span-2 lg:col-span-5">
          <StatCard label="Topics Done" value={doneCount} sub={`of ${topics.length} total`} icon={Target} />
          <StatCard label="Hours Logged" value={totalHours.toFixed(1)} sub="across all pillars" icon={Clock} />
          <StatCard
            label="LeetCode Solved"
            value={leetcode?.totalSolved ?? "—"}
            sub={
              leetcode
                ? `${leetcode.easy}E · ${leetcode.medium}M · ${leetcode.hard}H`
                : "Set username in Settings"
            }
            icon={Code2}
          />
          <StatCard
            label="GitHub Activity"
            value={github?.contributionsThisYear ?? "—"}
            sub={github ? `${github.totalStars} stars · ${github.publicRepos} repos` : "Set username in Settings"}
            icon={GitBranch}
          />
        </div>
        <div className="col-span-full sm:col-span-2 lg:col-span-4">
          <ScoreCard breakdown={breakdown} />
        </div>
      </div>

      {/* Focus + Weekly */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-title !mb-0">In Progress</p>
            <Link href="/pillars" className="btn btn-ghost text-xs">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {inProgress.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No active topics. Add one via Quick Add.</p>
          ) : (
            <ul className="space-y-2">
              {inProgress.slice(0, 5).map((t) => {
                const pillar = PILLARS.find((p) => p.id === t.pillar_id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-[var(--muted)]">{pillar?.name}</p>
                    </div>
                    <span className="text-xs tabular-nums text-[var(--muted)]">{t.hours}h</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-title !mb-0">This Week</p>
            <Link href="/weekly" className="btn btn-ghost text-xs">
              Edit plan <ArrowRight size={12} />
            </Link>
          </div>
          {weeklyGoals.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No weekly goals set.</p>
          ) : (
            <>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {weeklyDone}/{weeklyGoals.length}
                </span>
                <span className="text-xs text-[var(--muted)]">goals complete</span>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${(weeklyDone / weeklyGoals.length) * 100}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {weeklyGoals.slice(0, 4).map((g, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${g.done ? "bg-[var(--success)]" : "bg-[var(--border-strong)]"}`}
                    />
                    <span className={g.done ? "text-[var(--muted)] line-through" : ""}>{g.goal}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Pillars grid */}
      <div className="mt-6">
        <p className="section-title">Pillar Coverage</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {pillarStats.map((p) => (
            <Link
              key={p.id}
              href={`/pillars?pillar=${p.id}`}
              className="card card-hover p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs tabular-nums text-[var(--muted)]">{p.pct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.pct}%`, background: p.color }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {p.done}/{p.total} complete
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent + Chart */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <p className="section-title">Recent Activity</p>
          {recentTopics.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No activity yet</p>
          ) : (
            <ul className="space-y-3">
              {recentTopics.map((t) => (
                <li key={t.id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {PILLARS.find((p) => p.id === t.pillar_id)?.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2">
          <ImprovementChart data={history} />
        </div>
      </div>
    </>
  );
}
