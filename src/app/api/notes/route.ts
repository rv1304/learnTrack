import { NextRequest, NextResponse } from "next/server";
import { listNotes, upsertNote, deleteNote } from "@/lib/db";

export async function GET(req: NextRequest) {
  const pillar = req.nextUrl.searchParams.get("pillar") ?? undefined;
  return NextResponse.json(listNotes(pillar ?? undefined));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body.id ?? crypto.randomUUID();
  upsertNote({
    id,
    pillar_id: body.pillar_id ?? null,
    topic_id: body.topic_id ?? null,
    title: body.title,
    content: body.content,
  });
  return NextResponse.json({ id, ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteNote(id);
  return NextResponse.json({ ok: true });
}
