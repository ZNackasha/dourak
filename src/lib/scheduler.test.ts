import { describe, it, expect } from "vitest";
import { generateSchedule, SchedulerShift, SchedulerUser } from "./scheduler";

describe("Scheduler Algorithm", () => {
  const roleGuitar = "role-guitar";
  const roleDrums = "role-drums";

  const userGuitarist: SchedulerUser = {
    id: "u1",
    roles: [{ roleId: roleGuitar, type: "required" }],
  };
  const userDrummer: SchedulerUser = {
    id: "u2",
    roles: [{ roleId: roleDrums, type: "required" }],
  };
  const userMulti: SchedulerUser = {
    id: "u3",
    roles: [
      { roleId: roleGuitar, type: "required" },
      { roleId: roleDrums, type: "required" },
    ],
  };

  const baseTime = new Date("2025-01-01T10:00:00Z");
  const hourLater = new Date("2025-01-01T11:00:00Z");
  const twoHoursLater = new Date("2025-01-01T12:00:00Z");

  it("should assign a user with the correct role to an empty shift", () => {
    const shift: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [],
    };

    const result = generateSchedule([shift], [userGuitarist]);
    expect(result).toHaveLength(1);
    expect(result[0].shiftId).toBe("s1");
    expect(result[0].userId).toBe("u1");
  });

  it("should not assign a user without the required role", () => {
    const shift: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [],
    };

    const result = generateSchedule([shift], [userDrummer]);
    expect(result).toHaveLength(0);
  });

  it("should not double book a user for overlapping shifts", () => {
    const shift1: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [],
    };
    const shift2: SchedulerShift = {
      id: "s2",
      roleId: roleGuitar,
      start: new Date("2025-01-01T10:30:00Z"), // Overlaps
      end: new Date("2025-01-01T11:30:00Z"),
      assignments: [],
    };

    const result = generateSchedule([shift1, shift2], [userGuitarist]);

    // Should only assign one of them
    expect(result).toHaveLength(1);
  });

  it("should skip shifts that are already confirmed", () => {
    const shift: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [{ userId: "other", status: "CONFIRMED" }],
    };

    const result = generateSchedule([shift], [userGuitarist]);
    expect(result).toHaveLength(0);
  });

  it("should balance load between available users", () => {
    // 2 shifts at different times
    const shift1: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [],
    };
    const shift2: SchedulerShift = {
      id: "s2",
      roleId: roleGuitar,
      start: hourLater,
      end: twoHoursLater,
      assignments: [],
    };

    // 2 identical users
    const u1: SchedulerUser = {
      id: "u1",
      roles: [{ roleId: roleGuitar, type: "required" }],
    };
    const u2: SchedulerUser = {
      id: "u2",
      roles: [{ roleId: roleGuitar, type: "required" }],
    };

    const result = generateSchedule([shift1, shift2], [u1, u2]);

    expect(result).toHaveLength(2);
    // Expect different users assigned if load balancing works
    const assignedUsers = new Set(result.map((r) => r.userId));
    expect(assignedUsers.size).toBe(2);
  });

  it("should prioritize users with 'required' role over 'optional' role", () => {
    const shift: SchedulerShift = {
      id: "s1",
      roleId: roleGuitar,
      start: baseTime,
      end: hourLater,
      assignments: [],
    };

    const uRequired: SchedulerUser = {
      id: "uReq",
      roles: [{ roleId: roleGuitar, type: "required" }],
    };
    const uOptional: SchedulerUser = {
      id: "uOpt",
      roles: [{ roleId: roleGuitar, type: "optional" }],
    };

    // Even if optional user comes first in list
    const result = generateSchedule([shift], [uOptional, uRequired]);

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe("uReq");
  });
});

