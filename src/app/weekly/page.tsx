"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { PILLARS, type PillarId } from "@/lib/pillars";
import { PageHeader } from "@/components/ui/PageHeader";

interface Goal {
  pillar_id: string;
  goal: string;
  target_hours: number;
  done: boolean;
}

interface Plan {
  id: string;
  week_start: string;
  goals: string;
  completed: string;
}

export default function WeeklyPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [newPillar, setNewPillar] = useState<PillarId>(PILLARS[0].id);
  const [newHours, setNewHours] = useState("2");
  const [showForm, setShowForm] = useState(false);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const load = () => {
    fetch("/api/weekly")
      .then((r) => r.json())
      .then((data: Plan[]) => {
        setPlans(data);
        const current = data.find((p) => p.week_start === weekStart);
        setGoals(current ? JSON.parse(current.goals) : []);
      });
  };

  useEffect(() => {
    load();
  }, [weekStart]);

  const save = async (updatedGoals: Goal[]) => {
    const existing = plans.find((p) => p.week_start === weekStart);
    await fetch("/api/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: existing?.id,
        week_start: weekStart,
        goals: updatedGoals,
        completed: existing ? JSON.parse(existing.completed) : [],
      }),
    });
    setGoals(updatedGoals);
    load();
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    save([
      ...goals,
      {
        pillar_id: newPillar,
        goal: newGoal.trim(),
        target_hours: parseFloat(newHours) || 0,
        done: false,
      },
    ]);
    setNewGoal("");
    setShowForm(false);
  };

  const toggle = (idx: number) => {
    save(goals.map((g, i) => (i === idx ? { ...g, done: !g.done } : g)));
  };

  const remove = (idx: number) => {
    save(goals.filter((_, i) => i !== idx));
  };

  const doneCount = goals.filter((g) => g.done).length;
  const totalHours = goals.reduce((s, g) => s + g.target_hours, 0);
  const doneHours = goals.filter((g) => g.done).reduce((s, g) => s + g.target_hours, 0);

  const grouped = PILLARS.map((p) => ({
    pillar: p,
    goals: goals.map((g, i) => ({ ...g, idx: i })).filter((g) => g.pillar_id === p.id),
  })).filter((g) => g.goals.length > 0);

  return (
    <>
      <PageHeader
        title="Weekly Plan"
        description={`Week of ${format(new Date(weekStart), "MMM d, yyyy")}`}
        actions={
          <button type="button" onClick={() => setShowForm(true)} className="btn btn-primary w-full sm:w-auto">
            <Plus size={15} /> Add Goal
          </button>
        }
      />

      {/* Progress summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="stat-label">Goals</p>
          <p className="stat-value mt-1">
            {doneCount}/{goals.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Target Hours</p>
          <p className="stat-value mt-1">{totalHours}h</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Hours Completed</p>
          <p className="stat-value mt-1">{doneHours}h</p>
        </div>
      </div>

      <div className="card mb-6 h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-white transition-all"
          style={{ width: goals.length ? `${(doneCount / goals.length) * 100}%` : "0%" }}
        />
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="card mb-6 space-y-4 p-5">
          <p className="text-sm font-medium">New Weekly Goal</p>
          <select className="select" value={newPillar} onChange={(e) => setNewPillar(e.target.value as PillarId)}>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Goal description"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            type="number"
            step="0.5"
            placeholder="Target hours"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              Add Goal
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="card empty-state">
          <p className="font-medium text-[var(--muted-light)]">No goals this week</p>
          <p>Add goals manually or use Bulk Import</p>
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(({ pillar, goals: pGoals }) => (
            <div key={pillar.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: pillar.color }} />
                <p className="text-sm font-medium">{pillar.name}</p>
              </div>
              <ul className="space-y-2">
                {pGoals.map((g) => (
                  <li
                    key={g.idx}
                    className="card flex items-center gap-4 p-4"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(g.idx)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                        g.done
                          ? "border-[var(--success)] bg-[var(--success)]/10"
                          : "border-[var(--border-strong)] hover:border-[var(--muted)]"
                      }`}
                    >
                      {g.done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                    <div className="min-w-0 flex-1" onClick={() => toggle(g.idx)}>
                      <p className={`text-sm ${g.done ? "text-[var(--muted)] line-through" : "font-medium"}`}>
                        {g.goal}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{g.target_hours}h target</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(g.idx)}
                      className="btn-icon hover:!border-red-900 hover:!text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
