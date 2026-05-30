import { NextResponse } from "next/server";
import { getSetting, saveSnapshot } from "@/lib/db";
import { fetchGitHubStats } from "@/lib/github";

export async function POST() {
  const username = getSetting("github_username");
  if (!username) {
    return NextResponse.json({ error: "Set GitHub username in Settings" }, { status: 400 });
  }
  const token = getSetting("github_token") ?? undefined;
  const stats = await fetchGitHubStats(username, token);
  if (!stats) {
    return NextResponse.json({ error: "Could not fetch GitHub profile" }, { status: 404 });
  }
  saveSnapshot("github", stats);
  return NextResponse.json(stats);
}

export async function GET() {
  const username = getSetting("github_username");
  if (!username) return NextResponse.json(null);
  const token = getSetting("github_token") ?? undefined;
  const stats = await fetchGitHubStats(username, token);
  return NextResponse.json(stats);
}
