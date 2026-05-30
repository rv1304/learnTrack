export interface GitHubStats {
  username: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  contributionsThisYear: number;
  recentCommits: number;
  score: number;
}

export async function fetchGitHubStats(
  username: string,
  token?: string
): Promise<GitHubStats | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "learning-tracker",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const userRes = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!userRes.ok) return null;
    const user = await userRes.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers, next: { revalidate: 300 } }
    );
    const repos = reposRes.ok ? await reposRes.json() : [];
    const totalStars = Array.isArray(repos)
      ? repos.reduce((s: number, r: { stargazers_count?: number }) => s + (r.stargazers_count ?? 0), 0)
      : 0;

    let contributionsThisYear = 0;
    try {
      const contribRes = await fetch(
        `https://github-contributions-api.deno.dev/${username}.json`,
        { next: { revalidate: 3600 } }
      );
      if (contribRes.ok) {
        const contrib = await contribRes.json();
        const year = new Date().getFullYear();
        contributionsThisYear =
          contrib.contributions?.filter((c: { date: string }) => c.date.startsWith(String(year)))
            .reduce((s: number, c: { count: number }) => s + c.count, 0) ?? 0;
      }
    } catch {
      contributionsThisYear = 0;
    }

    const eventsRes = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=30`,
      { headers, next: { revalidate: 300 } }
    );
    let recentCommits = 0;
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      recentCommits = Array.isArray(events)
        ? events.filter(
            (e: { type: string; created_at: string }) =>
              e.type === "PushEvent" && new Date(e.created_at).getTime() > weekAgo
          ).length
        : 0;
    }

    const score = Math.min(
      100,
      Math.round(
        contributionsThisYear * 0.15 +
          totalStars * 2 +
          (user.public_repos ?? 0) * 1.5 +
          recentCommits * 3
      )
    );

    return {
      username,
      publicRepos: user.public_repos ?? 0,
      followers: user.followers ?? 0,
      totalStars,
      contributionsThisYear,
      recentCommits,
      score,
    };
  } catch {
    return null;
  }
}
