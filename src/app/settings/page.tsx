"use client";

import { useEffect, useState } from "react";
import { Save, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const [leetcode, setLeetcode] = useState("");
  const [github, setGithub] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [notifyTime, setNotifyTime] = useState("09:00");
  const [saved, setSaved] = useState(false);
  const [lcStatus, setLcStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [ghStatus, setGhStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setLeetcode(s.leetcode_username ?? "");
        setGithub(s.github_username ?? "");
        setGithubToken(s.github_token ?? "");
        setNotifyTime(localStorage.getItem("notify_time") ?? s.notify_time ?? "09:00");
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leetcode_username: leetcode.trim(),
        github_username: github.trim(),
        github_token: githubToken.trim(),
        notify_time: notifyTime,
      }),
    });
    localStorage.setItem("notify_time", notifyTime);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnections = async () => {
    setTesting(true);
    setLcStatus("idle");
    setGhStatus("idle");
    await save({ preventDefault: () => {} } as React.FormEvent);

    const [lc, gh] = await Promise.all([
      fetch("/api/sync/leetcode").then((r) => r.json()),
      fetch("/api/sync/github").then((r) => r.json()),
    ]);
    setLcStatus(lc && !lc.error ? "ok" : "fail");
    setGhStatus(gh && !gh.error ? "ok" : "fail");
    setTesting(false);
  };

  const StatusIcon = ({ status }: { status: "idle" | "ok" | "fail" }) => {
    if (status === "ok") return <CheckCircle2 size={16} className="text-[var(--success)]" />;
    if (status === "fail") return <XCircle size={16} className="text-[var(--danger)]" />;
    return null;
  };

  return (
    <>
      <PageHeader title="Settings" description="Connect external accounts and configure notifications" />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card space-y-5 p-6">
          <p className="section-title">Integrations</p>

          <div>
            <label className="label">LeetCode Username</label>
            <div className="flex items-center gap-2">
              <input
                className="input"
                placeholder="your-leetcode-handle"
                value={leetcode}
                onChange={(e) => setLeetcode(e.target.value)}
              />
              <StatusIcon status={lcStatus} />
            </div>
          </div>

          <div>
            <label className="label">GitHub Username</label>
            <div className="flex items-center gap-2">
              <input
                className="input"
                placeholder="your-github-handle"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
              <StatusIcon status={ghStatus} />
            </div>
          </div>

          <div>
            <label className="label">GitHub Token (optional)</label>
            <input
              className="input"
              type="password"
              placeholder="ghp_... for higher rate limits"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </div>

          <div className="divider" />

          <div>
            <label className="label">Daily Notification Time</label>
            <input
              className="input"
              type="time"
              value={notifyTime}
              onChange={(e) => setNotifyTime(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Browser notifications for daily LeetCode (requires tab open)
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              <Save size={14} />
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={testConnections}
              disabled={testing}
              className="btn btn-secondary"
            >
              <RefreshCw size={14} className={testing ? "animate-spin" : ""} />
              Test
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <p className="section-title">Score Formula</p>
            <div className="space-y-4">
              {[
                { label: "Learning Progress", weight: "40%", desc: "Topic completion & hours across 8 pillars" },
                { label: "LeetCode", weight: "35%", desc: "Problems solved by difficulty + submissions" },
                { label: "GitHub", weight: "25%", desc: "Contributions, stars, repos, recent activity" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{item.weight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="section-title">8 Pillars</p>
            <ul className="space-y-2 text-sm text-[var(--muted-light)]">
              <li>DSA</li>
              <li>CS Fundamentals</li>
              <li>System Design (HLD / LLD / SD)</li>
              <li>Database Optimization</li>
              <li>Concurrency</li>
              <li>APIs (gRPC / REST / GraphQL)</li>
              <li>Resilience & Scale</li>
              <li>STAR & Estimation</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
