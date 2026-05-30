"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Pencil,
  X,
} from "lucide-react";
import { PILLARS } from "@/lib/pillars";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Topic {
  id: string;
  pillar_id: string;
  title: string;
  status: string;
  hours: number;
  notes: string;
}

type Filter = "all" | "not_started" | "in_progress" | "done";

function PillarsContent() {
  const searchParams = useSearchParams();
  const initialPillar = searchParams.get("pillar") ?? PILLARS[0].id;

  const [selectedPillar, setSelectedPillar] = useState(initialPillar);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("not_started");
  const [hours, setHours] = useState("0");
  const [notes, setNotes] = useState("");

  const load = () => fetch("/api/topics").then((r) => r.json()).then(setTopics);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const p = searchParams.get("pillar");
    if (p && PILLARS.some((x) => x.id === p)) setSelectedPillar(p);
  }, [searchParams]);

  const pillar = PILLARS.find((p) => p.id === selectedPillar)!;

  const filtered = useMemo(() => {
    return topics
      .filter((t) => t.pillar_id === selectedPillar)
      .filter((t) => filter === "all" || t.status === filter)
      .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));
  }, [topics, selectedPillar, filter, search]);

  const pillarSummary = PILLARS.map((p) => {
    const pts = topics.filter((t) => t.pillar_id === p.id);
    const done = pts.filter((t) => t.status === "done").length;
    return { ...p, total: pts.length, done, pct: pts.length ? Math.round((done / pts.length) * 100) : 0 };
  });

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setHours("0");
    setStatus("not_started");
    setEditId(null);
    setShowForm(false);
  };

  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId ?? undefined,
        pillar_id: selectedPillar,
        title: title.trim(),
        status,
        hours: parseFloat(hours) || 0,
        notes,
      }),
    });
    resetForm();
    load();
  };

  const startEdit = (t: Topic) => {
    setEditId(t.id);
    setTitle(t.title);
    setStatus(t.status);
    setHours(String(t.hours));
    setNotes(t.notes);
    setShowForm(true);
  };

  const cycleStatus = async (t: Topic) => {
    const next =
      t.status === "not_started" ? "in_progress" : t.status === "in_progress" ? "done" : "not_started";
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, status: next }),
    });
    load();
  };

  const logHours = async (t: Topic, amount: number) => {
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, hours: t.hours + amount }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/topics?id=${id}`, { method: "DELETE" });
    load();
  };

  const StatusIcon = ({ s }: { s: string }) => {
    if (s === "done") return <CheckCircle2 size={16} className="text-[var(--success)]" />;
    if (s === "in_progress") return <PlayCircle size={16} className="text-[var(--warning)]" />;
    return <Circle size={16} className="text-[var(--muted)]" />;
  };

  return (
    <>
      <PageHeader
        title="Learning Pillars"
        description="8 core areas for interview preparation"
        actions={
          <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary w-full sm:w-auto">
            <Plus size={15} /> Add Topic
          </button>
        }
      />

      {/* Mobile: horizontal pillar picker */}
      <div className="scroll-row mb-4 lg:hidden">
        {pillarSummary.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPillar(p.id)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-all ${
              selectedPillar === p.id
                ? "border-[var(--border-strong)] bg-[var(--surface)]"
                : "border-[var(--border)] bg-[var(--bg)]"
            }`}
          >
            <span className="block whitespace-nowrap text-xs font-medium">{p.name}</span>
            <span className="text-[10px] tabular-nums text-[var(--muted)]">{p.pct}% · {p.done}/{p.total}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Desktop sidebar pillar list */}
        <div className="hidden space-y-1 lg:col-span-3 lg:block">
          {pillarSummary.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPillar(p.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left transition-all ${
                selectedPillar === p.id
                  ? "border-[var(--border-strong)] bg-[var(--surface)]"
                  : "border-transparent hover:bg-[var(--bg-hover)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs tabular-nums text-[var(--muted)]">{p.pct}%</span>
              </div>
              <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.pct}%`, background: p.color }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                {p.done}/{p.total} done
              </p>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold sm:text-lg">{pillar.name}</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  className="input !w-full !py-2.5 !pl-9 sm:!w-48"
                  placeholder="Search topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="tabs w-full sm:w-auto">
                <div className="tabs-scroll">
                {(["all", "in_progress", "not_started", "done"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`tab shrink-0 ${filter === f ? "tab-active" : ""}`}
                  >
                    {f === "all" ? "All" : f === "in_progress" ? "Active" : f === "not_started" ? "Todo" : "Done"}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>

          {showForm && (
            <form onSubmit={saveTopic} className="card mb-4 space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{editId ? "Edit Topic" : "New Topic"}</p>
                <button type="button" onClick={resetForm} className="btn-icon !border-0">
                  <X size={14} />
                </button>
              </div>
              <input
                className="input"
                placeholder="Topic title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <input
                  className="input"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                {editId ? "Save Changes" : "Add Topic"}
              </button>
            </form>
          )}

          <div className="card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p className="font-medium text-[var(--muted-light)]">No topics found</p>
                <p>Add topics manually or use Bulk Import</p>
              </div>
            ) : (
              <>
                {/* Mobile card list */}
                <ul className="md:hidden">
                  {filtered.map((t) => (
                    <li key={t.id} className="topic-card">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => cycleStatus(t)}
                          className="mt-0.5 shrink-0"
                          aria-label="Cycle status"
                        >
                          <StatusIcon s={t.status} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-snug">{t.title}</p>
                            <StatusBadge status={t.status} />
                          </div>
                          {t.notes && (
                            <p className="mt-1 text-xs text-[var(--muted)]">{t.notes}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs tabular-nums text-[var(--muted-light)]">{t.hours}h logged</span>
                            <button
                              type="button"
                              onClick={() => logHours(t, 0.5)}
                              className="btn btn-secondary !min-h-0 !py-1.5 !text-xs"
                            >
                              <Clock size={12} /> +30m
                            </button>
                            <button type="button" onClick={() => startEdit(t)} className="btn btn-ghost !min-h-0 !py-1.5 !text-xs">
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(t.id)}
                              className="btn btn-ghost !min-h-0 !py-1.5 !text-xs !text-[var(--danger)]"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop table */}
                <div className="table-scroll hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-8" />
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Hours</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <button type="button" onClick={() => cycleStatus(t)} title="Cycle status">
                          <StatusIcon s={t.status} />
                        </button>
                      </td>
                      <td>
                        <p className="font-medium">{t.title}</p>
                        {t.notes && (
                          <p className="mt-0.5 max-w-md truncate text-xs text-[var(--muted)]">{t.notes}</p>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-sm">{t.hours}h</span>
                          <button
                            type="button"
                            onClick={() => logHours(t, 0.5)}
                            className="btn btn-ghost !px-1.5 !py-0.5 text-[10px]"
                            title="Log 30 min"
                          >
                            <Clock size={12} /> +30m
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => startEdit(t)} className="btn-icon">
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(t.id)}
                            className="btn-icon hover:!border-red-900 hover:!text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function PillarsPage() {
  return (
    <Suspense fallback={<div className="text-[var(--muted)]">Loading...</div>}>
      <PillarsContent />
    </Suspense>
  );
}
