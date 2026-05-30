const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const USER_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum { difficulty count submissions }
        totalSubmissionNum { difficulty count submissions }
      }
      profile { ranking reputation }
    }
  }
`;

const DAILY_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      question {
        title
        titleSlug
        difficulty
        acRate
      }
    }
  }
`;

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  totalSubmissions: number;
  ranking: number | null;
  reputation: number | null;
  byDifficulty: { difficulty: string; solved: number; submissions: number }[];
}

export interface DailyQuestion {
  date: string;
  title: string;
  slug: string;
  difficulty: string;
  acRate: number | null;
  url: string;
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: USER_QUERY,
        variables: { username },
      }),
      next: { revalidate: 300 },
    });
    const json = await res.json();
    const user = json?.data?.matchedUser;
    if (!user) return null;

    const ac = user.submitStats?.acSubmissionNum ?? [];
    const total = user.submitStats?.totalSubmissionNum ?? [];
    const all = ac.find((x: { difficulty: string }) => x.difficulty === "All");
    const totalAll = total.find((x: { difficulty: string }) => x.difficulty === "All");

    const byDifficulty = ["Easy", "Medium", "Hard"].map((d) => {
      const solved = ac.find((x: { difficulty: string }) => x.difficulty === d);
      const subs = total.find((x: { difficulty: string }) => x.difficulty === d);
      return {
        difficulty: d,
        solved: solved?.count ?? 0,
        submissions: subs?.submissions ?? 0,
      };
    });

    return {
      username,
      totalSolved: all?.count ?? 0,
      easy: byDifficulty[0].solved,
      medium: byDifficulty[1].solved,
      hard: byDifficulty[2].solved,
      totalSubmissions: totalAll?.submissions ?? 0,
      ranking: user.profile?.ranking ?? null,
      reputation: user.profile?.reputation ?? null,
      byDifficulty,
    };
  } catch {
    return null;
  }
}

export async function fetchDailyQuestion(): Promise<DailyQuestion | null> {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: DAILY_QUERY }),
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const daily = json?.data?.activeDailyCodingChallengeQuestion;
    if (!daily?.question) return null;
    const q = daily.question;
    return {
      date: daily.date,
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      acRate: q.acRate ?? null,
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
    };
  } catch {
    return null;
  }
}
