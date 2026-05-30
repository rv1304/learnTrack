"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Bell, BellOff } from "lucide-react";

interface DailyQ {
  title: string;
  slug: string;
  difficulty: string;
  url: string;
}

const diffColor: Record<string, string> = {
  Easy: "badge-done",
  Medium: "badge-progress",
  Hard: "badge-todo",
};

export function DailyNotification() {
  const [question, setQuestion] = useState<DailyQ | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    fetch("/api/daily-question")
      .then((r) => r.json())
      .then((data) => {
        if (data.question) {
          setQuestion({
            title: data.question.title,
            slug: data.question.slug,
            difficulty: data.question.difficulty,
            url: data.question.url,
          });
        }
      })
      .catch(() => {});
  }, []);

  const requestNotify = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted" && question) {
      new Notification("Today's LeetCode Daily", {
        body: `${question.title} (${question.difficulty})`,
      });
    }
  };

  useEffect(() => {
    if (permission !== "granted" || !question) return;
    const check = () => {
      const settings = localStorage.getItem("notify_time") ?? "09:00";
      const [h, m] = settings.split(":").map(Number);
      const now = new Date();
      if (now.getHours() === h && now.getMinutes() === m) {
        const key = `notified-${now.toISOString().split("T")[0]}`;
        if (!localStorage.getItem(key)) {
          new Notification("Today's LeetCode Daily", {
            body: `${question.title} (${question.difficulty})`,
          });
          localStorage.setItem(key, "1");
        }
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [permission, question]);

  if (!question) return null;

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <span className="text-xs font-bold text-[var(--warning)]">LC</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Daily Challenge
          </p>
          <p className="mt-0.5 font-medium leading-snug">{question.title}</p>
          <span className={`badge mt-1.5 ${diffColor[question.difficulty] ?? "badge-todo"}`}>
            {question.difficulty}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={requestNotify}
          className="btn btn-secondary w-full sm:w-auto"
          title={permission === "granted" ? "Notifications enabled" : "Enable notifications"}
        >
          {permission === "granted" ? <Bell size={14} /> : <BellOff size={14} />}
          {permission === "granted" ? "Enabled" : "Notify"}
        </button>
        <a href={question.url} target="_blank" rel="noreferrer" className="btn btn-primary w-full sm:w-auto">
          Solve <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
