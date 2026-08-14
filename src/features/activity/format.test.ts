import { describe, expect, it } from "vitest";
import { activityToCsv, describeActivity } from "@/src/features/activity/format";
import type { ActivityEvent } from "@/src/core/sync/types";

const members = [
  {
    userId: "u1",
    email: "a@noirly.dev",
    displayName: "Ada",
  },
];

function event(
  partial: Partial<ActivityEvent> & Pick<ActivityEvent, "verb">,
): ActivityEvent {
  return {
    id: "e1",
    workspaceId: "ws",
    projectId: null,
    taskId: "t1",
    actorId: "u1",
    metadata: {},
    createdAt: "2026-08-14T10:00:00.000Z",
    ...partial,
  };
}

describe("describeActivity", () => {
  it("describes creates and updates", () => {
    expect(
      describeActivity(
        event({ verb: "task.created", metadata: { title: "Ship" } }),
        members,
      ),
    ).toContain("Ada created a task");
    expect(
      describeActivity(
        event({
          verb: "task.updated",
          metadata: {
            status: { from: "todo", to: "done" },
          },
        }),
        members,
      ),
    ).toContain("todo → done");
  });
});

describe("activityToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = activityToCsv(
      [
        event({
          verb: "task.created",
          metadata: { title: 'Hello, "world"' },
        }),
      ],
      members,
    );
    expect(csv.split("\n")[0]).toContain("createdAt");
    expect(csv).toContain("task.created");
    expect(csv).toContain("Ada");
  });
});
