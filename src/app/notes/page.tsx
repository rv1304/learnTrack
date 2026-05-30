"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Search, Pencil, X } from "lucide-react";
import { PILLARS } from "@/lib/pillars";
import { PageHeader } from "@/components/ui/PageHeader";

interface Note {
  id: string;
  pillar_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pillarId, setPillarId] = useState("");

  const load = () => fetch("/api/notes").then((r) => r.json()).then(setNotes);

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => !filterPillar || n.pillar_id === filterPillar)
      .filter(
        (n) =>
          !search ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      );
  }, [notes, search, filterPillar]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPillarId("");
    setEditId(null);
    setShowForm(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId ?? undefined,
        title: title.trim(),
        content,
        pillar_id: pillarId || null,
      }),
    });
    resetForm();
    load();
  };

  const startEdit = (n: Note) => {
    setEditId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setPillarId(n.pillar_id ?? "");
    setShowForm(true);
  };

  const remove = async (id: string) => {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    load();
  };

  const pillarName = (id: string | null) =>
    id ? PILLARS.find((p) => p.id === id)?.name ?? id : "General";

  const pillarColor = (id: string | null) =>
    PILLARS.find((p) => p.id === id)?.color ?? "#525252";

  return (
    <>
      <PageHeader
        title="Notes"
        description={`${notes.length} notes across your learning journey`}
        actions={
          <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary w-full sm:w-auto">
            <Plus size={15} /> New Note
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input !py-2 !pl-9"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select !w-auto"
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value)}
        >
          <option value="">All pillars</option>
          {PILLARS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={save} className="card mb-6 space-y-4 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{editId ? "Edit Note" : "New Note"}</p>
            <button type="button" onClick={resetForm} className="btn-icon !border-0">
              <X size={14} />
            </button>
          </div>
          <input
            className="input"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <select className="select" value={pillarId} onChange={(e) => setPillarId(e.target.value)}>
            <option value="">General (no pillar)</option>
            {PILLARS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <textarea
            className="textarea min-h-[160px]"
            placeholder="Write your notes..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            {editId ? "Save Changes" : "Save Note"}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((n) => (
          <article key={n.id} className="card card-hover group p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: pillarColor(n.pillar_id) }}
                  />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    {pillarName(n.pillar_id)}
                  </span>
                </div>
                <h3 className="mt-1 font-medium leading-snug">{n.title}</h3>
              </div>
              <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <button type="button" onClick={() => startEdit(n)} className="btn-icon">
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="btn-icon hover:!border-red-900 hover:!text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <pre className="line-clamp-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--muted-light)]">
              {n.content}
            </pre>
            <p className="mt-3 text-[11px] text-[var(--muted)]">
              {new Date(n.updated_at).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card empty-state">
          <p className="font-medium text-[var(--muted-light)]">No notes found</p>
          <p>Create your first note to capture learnings</p>
        </div>
      )}
    </>
  );
}
