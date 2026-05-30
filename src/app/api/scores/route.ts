import { NextResponse } from "next/server";
import { getScoreHistory, saveSnapshot, getSnapshots } from "@/lib/db";
import { getSetting } from "@/lib/db";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { fetchGitHubStats } from "@/lib/github";
import { calculateLearningScore, calculateTotalScore } from "@/lib/scoring";
import { saveScore } from "@/lib/db";

export async function GET() {
  const history = getScoreHistory(90);
  return NextResponse.json(history.map((h) => ({
    date: h.date,
    total: h.total_score,
    breakdown: JSON.parse(h.breakdown),
  })));
}

export async function POST() {
  const learning = calculateLearningScore();
  const lcUser = getSetting("leetcode_username");
  const ghUser = getSetting("github_username");
  const ghToken = getSetting("github_token") ?? undefined;

  const [leetcode, github] = await Promise.all([
    lcUser ? fetchLeetCodeStats(lcUser) : Promise.resolve(null),
    ghUser ? fetchGitHubStats(ghUser, ghToken) : Promise.resolve(null),
  ]);

  const breakdown = calculateTotalScore(learning, leetcode, github);
  const date = new Date().toISOString().split("T")[0];
  saveScore(date, breakdown.total, breakdown);

  if (leetcode) saveSnapshot("leetcode", leetcode);
  if (github) saveSnapshot("github", github);

  const snapshots = {
    leetcode: getSnapshots("leetcode", 1)[0]?.data ? JSON.parse(getSnapshots("leetcode", 1)[0].data) : null,
    github: getSnapshots("github", 1)[0]?.data ? JSON.parse(getSnapshots("github", 1)[0].data) : null,
  };

  return NextResponse.json({ breakdown, snapshots, history: getScoreHistory(90) });
}
