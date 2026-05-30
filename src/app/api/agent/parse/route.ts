import { NextRequest, NextResponse } from "next/server";
import { parseAgentInput } from "@/lib/agent-parser";
import { upsertTopic, upsertNote, upsertWeeklyPlan, listWeeklyPlans } from "@/lib/db";
import { startOfWeek, format } from "date-fns";

export async function POST(req: NextRequest) {
  const { text, apply } = await req.json();
  const parsed = parseAgentInput(text ?? "");

  if (!apply) {
    return NextResponse.json(parsed);
  }

  const topicIds: string[] = [];
  for (const t of parsed.topics) {
    const id = crypto.randomUUID();
    upsertTopic({
      id,
      pillar_id: t.pillar_id,
      title: t.title,
      status: t.status,
      hours: t.hours,
      notes: t.notes,
    });
    topicIds.push(id);
  }

  const noteIds: string[] = [];
  for (const n of parsed.notes) {
    const id = crypto.randomUUID();
    upsertNote({
      id,
      pillar_id: n.pillar_id,
      topic_id: null,
      title: n.title,
      content: n.content,
    });
    noteIds.push(id);
  }

  if (parsed.weeklyGoals.length > 0) {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const existing = listWeeklyPlans().find((p) => p.week_start === weekStart);
    const goals = parsed.weeklyGoals.map((g) => ({
      pillar_id: g.pillar_id,
      goal: g.goal,
      target_hours: g.target_hours,
      done: false,
    }));
    const merged = existing
      ? [...JSON.parse(existing.goals), ...goals]
      : goals;
    upsertWeeklyPlan({
      id: existing?.id ?? crypto.randomUUID(),
      week_start: weekStart,
      goals: JSON.stringify(merged),
      completed: existing?.completed ?? "[]",
      created_at: existing?.created_at ?? new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ...parsed,
    applied: { topics: topicIds.length, notes: noteIds.length, weeklyGoals: parsed.weeklyGoals.length },
  });
}
