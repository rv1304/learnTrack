import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tracker.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      pillar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      hours REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_notes (
      id TEXT PRIMARY KEY,
      pillar_id TEXT,
      topic_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      week_start TEXT NOT NULL,
      goals TEXT NOT NULL,
      completed TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_snapshots (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      data TEXT NOT NULL,
      captured_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS score_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_score REAL NOT NULL,
      breakdown TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_question_log (
      date TEXT PRIMARY KEY,
      question_slug TEXT,
      question_title TEXT,
      notified INTEGER DEFAULT 0
    );
  `);
}

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export interface Topic {
  id: string;
  pillar_id: string;
  title: string;
  status: string;
  hours: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function listTopics(pillarId?: string): Topic[] {
  if (pillarId) {
    return getDb()
      .prepare("SELECT * FROM topics WHERE pillar_id = ? ORDER BY updated_at DESC")
      .all(pillarId) as Topic[];
  }
  return getDb()
    .prepare("SELECT * FROM topics ORDER BY updated_at DESC")
    .all() as Topic[];
}

export function upsertTopic(topic: Omit<Topic, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string }) {
  const now = new Date().toISOString();
  const existing = getDb().prepare("SELECT id FROM topics WHERE id = ?").get(topic.id);
  if (existing) {
    getDb()
      .prepare(
        `UPDATE topics SET pillar_id=?, title=?, status=?, hours=?, notes=?, updated_at=? WHERE id=?`
      )
      .run(topic.pillar_id, topic.title, topic.status, topic.hours, topic.notes ?? "", now, topic.id);
  } else {
    getDb()
      .prepare(
        `INSERT INTO topics (id, pillar_id, title, status, hours, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`
      )
      .run(
        topic.id,
        topic.pillar_id,
        topic.title,
        topic.status,
        topic.hours,
        topic.notes ?? "",
        topic.created_at ?? now,
        topic.updated_at ?? now
      );
  }
}

export function deleteTopic(id: string) {
  getDb().prepare("DELETE FROM topics WHERE id = ?").run(id);
}

export interface LearningNote {
  id: string;
  pillar_id: string | null;
  topic_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function listNotes(pillarId?: string): LearningNote[] {
  if (pillarId) {
    return getDb()
      .prepare("SELECT * FROM learning_notes WHERE pillar_id = ? ORDER BY updated_at DESC")
      .all(pillarId) as LearningNote[];
  }
  return getDb()
    .prepare("SELECT * FROM learning_notes ORDER BY updated_at DESC")
    .all() as LearningNote[];
}

export function upsertNote(note: Omit<LearningNote, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string }) {
  const now = new Date().toISOString();
  const existing = getDb().prepare("SELECT id FROM learning_notes WHERE id = ?").get(note.id);
  if (existing) {
    getDb()
      .prepare(
        `UPDATE learning_notes SET pillar_id=?, topic_id=?, title=?, content=?, updated_at=? WHERE id=?`
      )
      .run(note.pillar_id, note.topic_id, note.title, note.content, now, note.id);
  } else {
    getDb()
      .prepare(
        `INSERT INTO learning_notes (id, pillar_id, topic_id, title, content, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`
      )
      .run(note.id, note.pillar_id, note.topic_id, note.title, note.content, note.created_at ?? now, note.updated_at ?? now);
  }
}

export function deleteNote(id: string) {
  getDb().prepare("DELETE FROM learning_notes WHERE id = ?").run(id);
}

export interface WeeklyPlan {
  id: string;
  week_start: string;
  goals: string;
  completed: string;
  created_at: string;
}

export function listWeeklyPlans(): WeeklyPlan[] {
  return getDb()
    .prepare("SELECT * FROM weekly_plans ORDER BY week_start DESC")
    .all() as WeeklyPlan[];
}

export function upsertWeeklyPlan(plan: WeeklyPlan) {
  getDb()
    .prepare(
      `INSERT INTO weekly_plans (id, week_start, goals, completed, created_at) VALUES (?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET goals=excluded.goals, completed=excluded.completed`
    )
    .run(plan.id, plan.week_start, plan.goals, plan.completed, plan.created_at);
}

export function saveSnapshot(source: string, data: object) {
  const id = crypto.randomUUID();
  getDb()
    .prepare("INSERT INTO sync_snapshots (id, source, data, captured_at) VALUES (?,?,?,?)")
    .run(id, source, JSON.stringify(data), new Date().toISOString());
}

export function getSnapshots(source: string, limit = 30) {
  return getDb()
    .prepare("SELECT * FROM sync_snapshots WHERE source = ? ORDER BY captured_at DESC LIMIT ?")
    .all(source, limit) as { id: string; source: string; data: string; captured_at: string }[];
}

export function saveScore(date: string, total: number, breakdown: object) {
  getDb()
    .prepare(
      `INSERT INTO score_history (id, date, total_score, breakdown) VALUES (?,?,?,?)
       ON CONFLICT(date) DO UPDATE SET total_score=excluded.total_score, breakdown=excluded.breakdown`
    )
    .run(crypto.randomUUID(), date, total, JSON.stringify(breakdown));
}

export function getScoreHistory(limit = 90) {
  return getDb()
    .prepare("SELECT * FROM score_history ORDER BY date ASC LIMIT ?")
    .all(limit) as { date: string; total_score: number; breakdown: string }[];
}

export function logDailyQuestion(date: string, slug: string, title: string) {
  getDb()
    .prepare(
      `INSERT INTO daily_question_log (date, question_slug, question_title, notified) VALUES (?,?,?,1)
       ON CONFLICT(date) DO UPDATE SET question_slug=excluded.question_slug, question_title=excluded.question_title, notified=1`
    )
    .run(date, slug, title);
}

export function getDailyQuestion(date: string) {
  return getDb()
    .prepare("SELECT * FROM daily_question_log WHERE date = ?")
    .get(date) as { date: string; question_slug: string; question_title: string } | undefined;
}
