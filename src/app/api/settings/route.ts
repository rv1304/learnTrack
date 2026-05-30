import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllSettings());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") setSetting(key, value);
  }
  return NextResponse.json({ ok: true });
}
