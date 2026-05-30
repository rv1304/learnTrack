import { NextRequest, NextResponse } from "next/server";
import { listWeeklyPlans, upsertWeeklyPlan } from "@/lib/db";

export async function GET() {
  return NextResponse.json(listWeeklyPlans());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body.id ?? crypto.randomUUID();
  upsertWeeklyPlan({
    id,
    week_start: body.week_start,
    goals: JSON.stringify(body.goals ?? []),
    completed: JSON.stringify(body.completed ?? []),
    created_at: body.created_at ?? new Date().toISOString(),
  });
  return NextResponse.json({ id, ok: true });
}
