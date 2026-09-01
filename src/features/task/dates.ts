export type DuePreset = "overdue" | "today" | "upcoming" | "none";

export type DueTone = "overdue" | "today" | "upcoming" | "none";

export function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const local = new Date(`${value}T12:00:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function isoToDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function dueTone(dueAt: string | null | undefined): DueTone | null {
  if (!dueAt) return null;
  const due = startOfDay(new Date(dueAt)).getTime();
  const today = startOfDay().getTime();
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "upcoming";
}

export function formatDue(dueAt: string | null | undefined): string | null {
  if (!dueAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dueAt));
}

export function dueRange(preset: DuePreset | "" | undefined): {
  dueAfter?: string;
  dueBefore?: string;
  unscheduled?: boolean;
} {
  if (!preset) return {};
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const tomorrowStart = startOfDay();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  switch (preset) {
    case "overdue":
      return { dueBefore: todayStart.toISOString() };
    case "today":
      return {
        dueAfter: todayStart.toISOString(),
        dueBefore: todayEnd.toISOString(),
      };
    case "upcoming":
      return { dueAfter: tomorrowStart.toISOString() };
    case "none":
      return { unscheduled: true };
  }
}

export function dueClassName(tone: DueTone | null): string {
  if (tone === "overdue") return "bg-[var(--accent-soft)] px-1 text-[var(--accent)]";
  if (tone === "today") return "text-[var(--foreground)]";
  return "text-[var(--muted-foreground)]";
}
