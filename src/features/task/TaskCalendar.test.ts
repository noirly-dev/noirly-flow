import { describe, expect, it } from "vitest";
import { isoToDateInput } from "@/src/features/task/dates";

describe("calendar day keys", () => {
  it("formats ISO due dates as local YYYY-MM-DD keys", () => {
    expect(isoToDateInput("2026-08-14T12:00:00.000Z").length).toBe(10);
    expect(isoToDateInput(null)).toBe("");
  });
});
