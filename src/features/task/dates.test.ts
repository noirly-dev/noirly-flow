import { describe, expect, it } from "vitest";
import { dateInputToIso, dueRange, isoToDateInput } from "@/src/features/task/dates";

describe("date input round-trip", () => {
  it("converts a date input to ISO and back", () => {
    const iso = dateInputToIso("2026-08-14");
    expect(iso).toBeTruthy();
    expect(isoToDateInput(iso)).toBe("2026-08-14");
  });

  it("treats empty as no date", () => {
    expect(dateInputToIso("")).toBeNull();
    expect(isoToDateInput(null)).toBe("");
  });
});

describe("dueRange", () => {
  it("marks unscheduled for none", () => {
    expect(dueRange("none")).toEqual({ unscheduled: true });
  });

  it("returns nothing when unset", () => {
    expect(dueRange("")).toEqual({});
    expect(dueRange(undefined)).toEqual({});
  });
});
