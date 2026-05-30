"use client";

import { useState } from "react";
import { Upload, Eye, Copy, Check } from "lucide-react";
import { AGENT_FORMAT_HELP } from "@/lib/agent-parser";
import { PageHeader } from "@/components/ui/PageHeader";
import { PILLARS } from "@/lib/pillars";

const TEMPLATES = {
  bulk: `@bulk
dsa|Binary Search|in_progress|2|mastered template
dsa|Dynamic Programming|not_started|0
cs-fundamentals|OS Processes & Threads|done|3
system-design|URL Shortener HLD|in_progress|4
database|B-Tree Indexing|not_started|0
concurrency|Mutex vs Semaphore|in_progress|1.5
api|GraphQL vs REST|done|2
resilience-scale|Circuit Breaker Pattern|not_started|0
behavioral|STAR - Leadership Story|in_progress|1`,
  blocks: `PILLAR: dsa
TOPIC: Sliding Window
STATUS: in_progress
HOURS: 2
NOTES: fixed + variable window patterns
---
PILLAR: system-design
TOPIC: Distributed Cache
STATUS: not_started
HOURS: 0
---
TYPE: weekly
PILLAR: dsa
GOAL: Solve 10 medium problems
HOURS: 8`,
};

interface ParsedTopic {
  pillar_id: string;
  title: string;
  status: string;
  hours: number;
}

interface ParsedNote {
  pillar_id: string | null;
  title: string;
}

interface Preview {
  topics: ParsedTopic[];
  notes: ParsedNote[];
  weeklyGoals: { pillar_id: string; goal: string; target_hours: number }[];
  errors: string[];
}

export default function AgentPage() {
  const [text, setText] = useState(TEMPLATES.bulk);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async (apply: boolean) => {
    setLoading(true);
    setApplied(null);
    try {
      const res = await fetch("/api/agent/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, apply }),
      });
      const data = await res.json();
      if (apply && data.applied) {
        setApplied(
          `Imported ${data.applied.topics} topics, ${data.applied.notes} notes, ${data.applied.weeklyGoals} weekly goals`
        );
        setPreview(null);
      } else {
        setPreview(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const pillarName = (id: string) => PILLARS.find((p) => p.id === id)?.name ?? id;

  const copyFormat = () => {
    navigator.clipboard.writeText(AGENT_FORMAT_HELP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Bulk Import"
        description="Paste structured text to auto-create topics, notes, and weekly goals"
        actions={
          <div className="tabs">
            <button
              type="button"
              className="tab tab-active"
              onClick={() => setText(TEMPLATES.bulk)}
            >
              Pipe Template
            </button>
            <button type="button" className="tab" onClick={() => setText(TEMPLATES.blocks)}>
              Block Template
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <textarea
            className="textarea min-h-[240px] font-mono text-[13px] sm:min-h-[400px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run(false)}
              disabled={loading}
              className="btn btn-secondary w-full sm:w-auto"
            >
              <Eye size={14} /> Preview
            </button>
            <button
              type="button"
              onClick={() => run(true)}
              disabled={loading}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Upload size={14} /> Import All
            </button>
          </div>
          {applied && (
            <div className="rounded-lg border border-green-900/40 bg-green-950/20 px-4 py-3 text-sm text-[var(--success)]">
              {applied}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="card p-5 lg:sticky lg:top-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title !mb-0">Format Guide</p>
              <button type="button" onClick={copyFormat} className="btn btn-ghost !px-2">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--muted-light)]">
              {AGENT_FORMAT_HELP}
            </pre>
          </div>
        </div>
      </div>

      {preview && (
        <div className="mt-6 space-y-4">
          {preview.errors.length > 0 && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-[var(--danger)]">
              {preview.errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-4 text-center">
              <p className="stat-value">{preview.topics.length}</p>
              <p className="stat-label mt-1">Topics</p>
            </div>
            <div className="card p-4 text-center">
              <p className="stat-value">{preview.notes.length}</p>
              <p className="stat-label mt-1">Notes</p>
            </div>
            <div className="card p-4 text-center">
              <p className="stat-value">{preview.weeklyGoals.length}</p>
              <p className="stat-label mt-1">Weekly Goals</p>
            </div>
          </div>

          {preview.topics.length > 0 && (
            <>
              <ul className="space-y-2 md:hidden">
                {preview.topics.map((t, i) => (
                  <li key={i} className="card p-4">
                    <p className="font-medium">{t.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{pillarName(t.pillar_id)}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="badge badge-todo">{t.status.replace("_", " ")}</span>
                      <span className="text-xs text-[var(--muted)]">{t.hours}h</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="card hidden overflow-hidden table-scroll md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pillar</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.topics.map((t, i) => (
                    <tr key={i}>
                      <td className="text-[var(--muted-light)]">{pillarName(t.pillar_id)}</td>
                      <td className="font-medium">{t.title}</td>
                      <td>{t.status.replace("_", " ")}</td>
                      <td className="tabular-nums">{t.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
