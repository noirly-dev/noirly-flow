import type { RecurrenceRule } from "@/src/core/sync/types";

export function asRecurrenceRule(
  value: { frequency?: string; interval?: number } | null | undefined,
): RecurrenceRule | null {
  if (value?.frequency !== "daily" && value?.frequency !== "weekly") {
    return null;
  }
  return {
    frequency: value.frequency,
    interval: Math.max(1, value.interval || 1),
  };
}

export function addRecurrenceInterval(from: Date, rule: RecurrenceRule): Date {
  const interval = Math.max(1, rule.interval || 1);
  const next = new Date(from.getTime());
  if (rule.frequency === "daily") {
    next.setDate(next.getDate() + interval);
  } else {
    next.setDate(next.getDate() + 7 * interval);
  }
  return next;
}

/** Next due date for a completed occurrence. Skips forward until today or later. */
export function nextOccurrenceDueAt(
  dueAt: string | Date | null | undefined,
  rule: RecurrenceRule,
  now = new Date(),
): Date {
  const parsed =
    dueAt instanceof Date ? dueAt : dueAt ? new Date(dueAt) : now;
  const origin = Number.isNaN(parsed.getTime()) ? now : parsed;
  let next = addRecurrenceInterval(origin, rule);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let guard = 0;
  while (next < today && guard < 366) {
    next = addRecurrenceInterval(next, rule);
    guard += 1;
  }
  return next;
}
