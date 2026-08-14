import {
  dueClassName,
  dueTone,
  formatDue,
} from "@/src/features/task/dates";

export function TaskDueBadge({ dueAt }: { dueAt: string | null | undefined }) {
  const label = formatDue(dueAt);
  if (!label) return null;
  const tone = dueTone(dueAt);

  return (
    <span className={`font-mono text-[11px] uppercase tracking-wide ${dueClassName(tone)}`}>
      {tone === "overdue" ? `Overdue · ${label}` : tone === "today" ? `Today · ${label}` : label}
    </span>
  );
}
