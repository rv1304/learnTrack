import { NextResponse } from "next/server";
import { fetchDailyQuestion } from "@/lib/leetcode";
import { getDailyQuestion, logDailyQuestion } from "@/lib/db";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const cached = getDailyQuestion(today);
  const daily = await fetchDailyQuestion();

  if (daily) {
    logDailyQuestion(today, daily.slug, daily.title);
  }

  return NextResponse.json({
    today,
    cached,
    question: daily,
  });
}
