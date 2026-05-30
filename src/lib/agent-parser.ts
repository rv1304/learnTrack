import { resolvePillar, type PillarId } from "./pillars";

export interface ParsedTopic {
  pillar_id: PillarId;
  title: string;
  status: "not_started" | "in_progress" | "done";
  hours: number;
  notes: string;
}

export interface ParsedNote {
  pillar_id: PillarId | null;
  title: string;
  content: string;
}

export interface ParsedWeeklyGoal {
  pillar_id: PillarId;
  goal: string;
  target_hours: number;
}

export interface AgentParseResult {
  topics: ParsedTopic[];
  notes: ParsedNote[];
  weeklyGoals: ParsedWeeklyGoal[];
  errors: string[];
}

const STATUS_MAP: Record<string, ParsedTopic["status"]> = {
  not_started: "not_started",
  todo: "not_started",
  pending: "not_started",
  in_progress: "in_progress",
  doing: "in_progress",
  progress: "in_progress",
  done: "done",
  complete: "done",
  completed: "done",
};

function parseStatus(s: string): ParsedTopic["status"] {
  return STATUS_MAP[s.trim().toLowerCase()] ?? "not_started";
}

/** Block format:
 * PILLAR: dsa
 * TOPIC: Binary Search
 * STATUS: in_progress
 * HOURS: 2
 * NOTES: practiced variants
 * ---
 */
function parseBlockFormat(text: string): AgentParseResult {
  const result: AgentParseResult = { topics: [], notes: [], weeklyGoals: [], errors: [] };
  const blocks = text.split(/\n---+\n|\n===+\n/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const kv: Record<string, string> = {};
    let noteBody: string[] = [];
    let inNote = false;

    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)\s*:\s*(.*)$/i);
      if (match && !inNote) {
        kv[match[1].toLowerCase()] = match[2];
        if (match[1].toLowerCase() === "content" || match[1].toLowerCase() === "note_body") {
          inNote = true;
          noteBody = [match[2]];
        }
      } else if (inNote) {
        noteBody.push(line);
      }
    }

    const type = (kv.type ?? kv.kind ?? "topic").toLowerCase();

    if (type === "note") {
      const pillar = kv.pillar ? resolvePillar(kv.pillar) : null;
      if (kv.pillar && !pillar) result.errors.push(`Unknown pillar: ${kv.pillar}`);
      result.notes.push({
        pillar_id: pillar,
        title: kv.title ?? kv.topic ?? "Untitled Note",
        content: noteBody.length ? noteBody.join("\n") : (kv.notes ?? kv.content ?? ""),
      });
      continue;
    }

    if (type === "weekly" || type === "goal") {
      const pillar = resolvePillar(kv.pillar ?? "");
      if (!pillar) {
        result.errors.push(`Weekly goal missing pillar: ${kv.pillar}`);
        continue;
      }
      result.weeklyGoals.push({
        pillar_id: pillar,
        goal: kv.goal ?? kv.topic ?? kv.title ?? "",
        target_hours: parseFloat(kv.hours ?? kv.target_hours ?? "0") || 0,
      });
      continue;
    }

    const pillar = resolvePillar(kv.pillar ?? kv.p ?? "");
    if (!pillar) {
      result.errors.push(`Block missing valid pillar: ${JSON.stringify(kv)}`);
      continue;
    }
    const title = kv.topic ?? kv.title ?? kv.name;
    if (!title) {
      result.errors.push(`Block missing topic title`);
      continue;
    }
    result.topics.push({
      pillar_id: pillar,
      title,
      status: parseStatus(kv.status ?? "not_started"),
      hours: parseFloat(kv.hours ?? "0") || 0,
      notes: kv.notes ?? "",
    });
  }
  return result;
}

/** Pipe format: pillar|title|status|hours|notes */
function parsePipeFormat(text: string): AgentParseResult {
  const result: AgentParseResult = { topics: [], notes: [], weeklyGoals: [], errors: [] };
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  for (const line of lines) {
    if (line.toLowerCase().startsWith("@bulk") || line.toLowerCase().startsWith("@note")) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2) continue;

    if (parts[0].toLowerCase() === "note") {
      const pillar = parts[1] ? resolvePillar(parts[1]) : null;
      result.notes.push({
        pillar_id: pillar,
        title: parts[2] ?? "Note",
        content: parts.slice(3).join("|") || "",
      });
      continue;
    }

    const pillar = resolvePillar(parts[0]);
    if (!pillar) {
      result.errors.push(`Unknown pillar in line: ${line}`);
      continue;
    }
    result.topics.push({
      pillar_id: pillar,
      title: parts[1],
      status: parseStatus(parts[2] ?? "not_started"),
      hours: parseFloat(parts[3] ?? "0") || 0,
      notes: parts[4] ?? "",
    });
  }
  return result;
}

export function parseAgentInput(text: string): AgentParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { topics: [], notes: [], weeklyGoals: [], errors: [] };

  const hasBlocks = /^(PILLAR|TOPIC|TYPE)\s*:/im.test(trimmed);
  const hasPipes = trimmed.includes("|") && !hasBlocks;

  if (hasBlocks) return parseBlockFormat(trimmed);
  if (hasPipes || trimmed.toLowerCase().includes("@bulk")) return parsePipeFormat(trimmed);

  return parseBlockFormat(trimmed);
}

export const AGENT_FORMAT_HELP = `Agent formats supported:

1) Block format (paste multiple blocks separated by ---):
PILLAR: dsa
TOPIC: Binary Search
STATUS: in_progress
HOURS: 2
NOTES: practiced variants
---
PILLAR: system-design
TOPIC: URL Shortener
STATUS: done
HOURS: 4

2) Bulk pipe format (one per line):
dsa|Two Pointers|done|3
api|GraphQL basics|in_progress|1.5
note|dsa|My patterns|Sliding window template...

3) Weekly goals:
TYPE: weekly
PILLAR: dsa
GOAL: Solve 10 medium problems
HOURS: 8`;
