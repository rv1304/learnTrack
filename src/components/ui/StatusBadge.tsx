export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "done"
      ? "badge badge-done"
      : status === "in_progress"
        ? "badge badge-progress"
        : "badge badge-todo";
  const label =
    status === "done" ? "Done" : status === "in_progress" ? "In Progress" : "Not Started";
  return <span className={cls}>{label}</span>;
}
