"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PILLARS, type PillarId } from "@/lib/pillars";

export function QuickAdd({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pillarId, setPillarId] = useState<PillarId>(PILLARS[0].id);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar_id: pillarId,
          title: title.trim(),
          status: "not_started",
          hours: 0,
        }),
      });
      setTitle("");
      setOpen(false);
      onAdded?.();
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary w-full sm:w-auto">
        <Plus size={15} /> Quick Add
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-3 sm:w-auto sm:space-y-0 sm:p-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2"
    >
      <input
        className="input !w-full sm:!w-auto sm:min-w-[180px] sm:flex-1 !border sm:!border-0 !bg-[var(--bg)] sm:!bg-transparent !py-2.5 sm:!py-1.5"
        placeholder="Topic name..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <select
        className="select !w-full sm:!w-auto !border sm:!border-0 !bg-[var(--bg)] sm:!bg-transparent !py-2.5 sm:!py-1.5"
        value={pillarId}
        onChange={(e) => setPillarId(e.target.value as PillarId)}
      >
        {PILLARS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary flex-1 sm:flex-none !py-2.5 sm:!py-1.5">
          Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-icon !border-0">
          <X size={14} />
        </button>
      </div>
    </form>
  );
}
