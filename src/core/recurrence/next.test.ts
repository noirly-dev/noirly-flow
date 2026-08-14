import { describe, expect, it } from "vitest";
import {
  addRecurrenceInterval,
  asRecurrenceRule,
  nextOccurrenceDueAt,
} from "@/src/core/recurrence/next";

describe("asRecurrenceRule", () => {
  it("accepts daily and weekly", () => {
    expect(asRecurrenceRule({ frequency: "daily", interval: 2 })).toEqual({
      frequency: "daily",
      interval: 2,
    });
    expect(asRecurrenceRule({ frequency: "weekly" })).toEqual({
      frequency: "weekly",
      interval: 1,
    });
  });

  it("rejects empty or unsupported rules", () => {
    expect(asRecurrenceRule(null)).toBeNull();
    expect(asRecurrenceRule({ frequency: "monthly" })).toBeNull();
  });
});

describe("nextOccurrenceDueAt", () => {
  const daily = { frequency: "daily" as const, interval: 1 };
  const weekly = { frequency: "weekly" as const, interval: 1 };

  it("advances one day from the due date", () => {
    const next = nextOccurrenceDueAt(
      new Date("2026-08-10T12:00:00"),
      daily,
      new Date("2026-08-10T18:00:00"),
    );
    expect(next.toISOString().slice(0, 10)).toBe("2026-08-11");
  });

  it("advances one week", () => {
    const from = new Date("2026-08-10T12:00:00");
    const next = addRecurrenceInterval(from, weekly);
    expect(next.toISOString().slice(0, 10)).toBe("2026-08-17");
  });

  it("skips overdue occurrences until today", () => {
    const next = nextOccurrenceDueAt(
      new Date("2026-07-01T12:00:00"),
      weekly,
      new Date("2026-08-14T09:00:00"),
    );
    expect(next.getTime()).toBeGreaterThanOrEqual(
      new Date("2026-08-14T00:00:00").getTime(),
    );
    expect(next.getDay()).toBe(new Date("2026-07-01T12:00:00").getDay());
  });

  it("uses now when the completed task had no due date", () => {
    const now = new Date("2026-08-14T15:00:00");
    const next = nextOccurrenceDueAt(null, daily, now);
    expect(next.toISOString().slice(0, 10)).toBe("2026-08-15");
  });
});
