import { NextRequest, NextResponse } from "next/server";
import { listTopics, upsertTopic, deleteTopic } from "@/lib/db";

export async function GET(req: NextRequest) {
  const pillar = req.nextUrl.searchParams.get("pillar") ?? undefined;
  return NextResponse.json(listTopics(pillar ?? undefined));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body.id ?? crypto.randomUUID();
  upsertTopic({
    id,
    pillar_id: body.pillar_id,
    title: body.title,
    status: body.status ?? "not_started",
    hours: body.hours ?? 0,
    notes: body.notes ?? "",
  });
  return NextResponse.json({ id, ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteTopic(id);
  return NextResponse.json({ ok: true });
}
