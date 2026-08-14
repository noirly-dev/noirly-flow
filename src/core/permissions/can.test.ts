import { describe, expect, it } from "vitest";
import { can, roleAtLeast } from "@/src/core/permissions/can";

describe("can", () => {
  it("lets viewers look, not write", () => {
    expect(can("viewer", "workspace.view")).toBe(true);
    expect(can("viewer", "task.write")).toBe(false);
    expect(can("viewer", "project.write")).toBe(false);
    expect(can("viewer", "members.manage")).toBe(false);
  });

  it("lets members write tasks and projects", () => {
    expect(can("member", "task.write")).toBe(true);
    expect(can("member", "project.write")).toBe(true);
    expect(can("member", "members.manage")).toBe(false);
  });

  it("lets admins manage members", () => {
    expect(can("admin", "members.manage")).toBe(true);
    expect(can("owner", "members.manage")).toBe(true);
  });
});

describe("roleAtLeast", () => {
  it("compares ranks", () => {
    expect(roleAtLeast("viewer", "viewer")).toBe(true);
    expect(roleAtLeast("member", "viewer")).toBe(true);
    expect(roleAtLeast("viewer", "member")).toBe(false);
    expect(roleAtLeast("owner", "admin")).toBe(true);
  });
});
