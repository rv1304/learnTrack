import { NextResponse } from "next/server";
import { getSetting, saveSnapshot } from "@/lib/db";
import { fetchLeetCodeStats } from "@/lib/leetcode";

export async function POST() {
  const username = getSetting("leetcode_username");
  if (!username) {
    return NextResponse.json({ error: "Set LeetCode username in Settings" }, { status: 400 });
  }
  const stats = await fetchLeetCodeStats(username);
  if (!stats) {
    return NextResponse.json({ error: "Could not fetch LeetCode profile" }, { status: 404 });
  }
  saveSnapshot("leetcode", stats);
  return NextResponse.json(stats);
}

export async function GET() {
  const username = getSetting("leetcode_username");
  if (!username) return NextResponse.json(null);
  const stats = await fetchLeetCodeStats(username);
  return NextResponse.json(stats);
}
