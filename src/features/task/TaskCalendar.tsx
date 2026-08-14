"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/src/core/sync/types";
import { isoToDateInput } from "@/src/features/task/dates";

type Props = {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function dateKey(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Monday-first index 0..6 for a JS Date.getDay() value. */
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

export function TaskCalendar({ tasks, onOpenTask }: Props) {
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.status === "canceled") continue;
      const key = isoToDateInput(task.dueAt);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [tasks]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const startPad = mondayIndex(new Date(cursor.year, cursor.month, 1).getDay());
  const cells: Array<{ key: string; day: number | null }> = [];
  for (let i = 0; i < startPad; i += 1) {
    cells.push({ key: `pad-${i}`, day: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: dateKey(cursor.year, cursor.month, day),
      day,
    });
  }

  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const undated = tasks.filter(
    (task) => !task.dueAt && task.status !== "canceled",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setCursor((current) => {
              const date = new Date(current.year, current.month - 1, 1);
              return { year: date.getFullYear(), month: date.getMonth() };
            })
          }
          className="border border-dashed border-hairline px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Prev
        </button>
        <p className="text-sm font-medium text-ink">
          {monthLabel(cursor.year, cursor.month)}
        </p>
        <button
          type="button"
          onClick={() =>
            setCursor((current) => {
              const date = new Date(current.year, current.month + 1, 1);
              return { year: date.getFullYear(), month: date.getMonth() };
            })
          }
          className="border border-dashed border-hairline px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Next
        </button>
      </div>

      <div className="overflow-x-auto border border-dashed border-hairline bg-surface">
        <div className="grid min-w-[42rem] grid-cols-7 border-b border-dashed border-hairline">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid min-w-[42rem] grid-cols-7">
          {cells.map((cell) => {
            if (cell.day === null) {
              return (
                <div
                  key={cell.key}
                  className="min-h-28 border-b border-r border-dashed border-hairline bg-canvas/40"
                />
              );
            }
            const key = dateKey(cursor.year, cursor.month, cell.day);
            const dayTasks = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={cell.key}
                className="min-h-28 border-b border-r border-dashed border-hairline p-2"
              >
                <p
                  className={`inline-block font-mono text-[11px] ${
                    isToday ? "bg-ink px-1 text-canvas" : "text-muted"
                  }`}
                >
                  {cell.day}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {dayTasks.slice(0, 4).map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => onOpenTask(task.id)}
                        className={`w-full truncate px-1.5 py-1 text-left text-[11px] ${
                          task.status === "done"
                            ? "text-muted line-through"
                            : "bg-canvas text-ink hover:bg-ink hover:text-canvas"
                        }`}
                      >
                        {task.title}
                      </button>
                    </li>
                  ))}
                  {dayTasks.length > 4 ? (
                    <li className="px-1 text-[10px] text-muted">
                      +{dayTasks.length - 4} more
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 ? (
        <div className="border border-dashed border-hairline bg-surface p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            No due date
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {undated.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="text-sm text-muted hover:text-ink"
                >
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
