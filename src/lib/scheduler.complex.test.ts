import { describe, it, expect } from "vitest";
import { generateSchedule, SchedulerShift, SchedulerUser } from "./scheduler";

describe("Complex Schedule Scenario", () => {
  // Roles
  const roleNursery = "Nursery";
  const roleKidsWorship = "Kids Worship";
  const rolePreschool = "Preschool";
  const roleElementary = "Elementary";
  const roleMiddleSchool = "Middle School";
  const roleWorship = "Worship";

  // Dates
  const date07 = "2025-12-07";
  const date14 = "2025-12-14";
  const date21 = "2025-12-21";
  const date28 = "2025-12-28";

  // Users
  const users: SchedulerUser[] = [
    { id: "Leila Alhindi", roleIds: [roleNursery], availableEvents: [] },
    {
      id: "Lillian Nackasha",
      roleIds: [roleNursery, roleKidsWorship],
      availableEvents: [date14, date28],
    },
    {
      id: "Rebecca Yonan",
      roleIds: [
        roleNursery,
        roleKidsWorship,
        roleElementary,
        roleMiddleSchool,
        roleWorship,
      ],
      availableEvents: [date14, date21, date28],
    },
    {
      id: "Shams Morolli",
      roleIds: [roleNursery, roleKidsWorship, roleMiddleSchool, roleWorship],
      availableEvents: [],
    },
    { id: "Shantal AlNajar", roleIds: [roleNursery], availableEvents: [] },
    {
      id: "Marianne Salman",
      roleIds: [roleNursery, rolePreschool, roleElementary, roleMiddleSchool],
      availableEvents: [date14, date28],
    },
    {
      id: "Christa Kasbrooks",
      roleIds: [roleKidsWorship, roleWorship],
      availableEvents: [],
    },
    {
      id: "Nada Yousif",
      roleIds: [roleKidsWorship, roleElementary],
      availableEvents: [],
    },
    {
      id: "Nana Akrawi",
      roleIds: [roleKidsWorship, roleElementary],
      availableEvents: [],
    },
    {
      id: "Zina Hannah",
      roleIds: [roleKidsWorship, rolePreschool, roleMiddleSchool],
      availableEvents: [date21, date28],
    },
    {
      id: "Christine Awabdeh",
      roleIds: [rolePreschool],
      availableEvents: [date14],
    },
    { id: "Gracie Fram", roleIds: [rolePreschool], availableEvents: [date07] },
    {
      id: "Mikayla Hannah",
      roleIds: [rolePreschool],
      availableEvents: [date21],
    },
    {
      id: "Ricky Kasbrooks",
      roleIds: [rolePreschool, roleElementary, roleMiddleSchool],
      availableEvents: [],
    },
    {
      id: "Sally Haddad",
      roleIds: [roleElementary],
      availableEvents: [date14],
    },
    { id: "Dalia Jamil", roleIds: [roleMiddleSchool], availableEvents: [] },
    { id: "Erica Kaspo", roleIds: [roleMiddleSchool], availableEvents: [] },
    { id: "Manny Salman", roleIds: [roleMiddleSchool], availableEvents: [] },
    { id: "Alex Kaspo", roleIds: [roleWorship], availableEvents: [] },
    {
      id: "Andrew Awabdeh",
      roleIds: [roleWorship],
      availableEvents: [date07, date14, date21, date28],
    },
    {
      id: "Anthony Morolli",
      roleIds: [roleWorship],
      availableEvents: [date07, date14, date21, date28],
    },
    { id: "Hashem Alfay", roleIds: [roleWorship], availableEvents: [] },
    { id: "Jamil Haddad", roleIds: [roleWorship], availableEvents: [] },
    { id: "Jeremy Ishow", roleIds: [roleWorship], availableEvents: [] },
    {
      id: "Jonah Yonan",
      roleIds: [roleWorship],
      availableEvents: [date07, date14, date21, date28],
    },
    { id: "Nicole Said", roleIds: [roleWorship], availableEvents: [] },
    { id: "Rabi Alhindi", roleIds: [roleWorship], availableEvents: [] },
    { id: "Razan Yared", roleIds: [roleWorship], availableEvents: [] },
  ];

  // Helper to create shifts with proper time ranges
  const createShift = (
    dateStr: string,
    roleId: string,
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number,
    index: number = 0
  ): SchedulerShift => {
    const start = new Date(
      `${dateStr}T${String(startHour).padStart(2, "0")}:${String(
        startMin
      ).padStart(2, "0")}:00Z`
    );
    const end = new Date(
      `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(
        2,
        "0"
      )}:00Z`
    );

    return {
      id: `${roleId}-${dateStr}-${index}`,
      roleId,
      start,
      end,
      assignments: [],
    };
  };

  // Helper functions for each role type
  const createNurseryShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roleNursery, 12, 0, 13, 0, index);
  const createKidsWorshipShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roleKidsWorship, 12, 0, 12, 30, index);
  const createPreschoolShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, rolePreschool, 12, 30, 13, 0, index);
  const createElementaryShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roleElementary, 12, 30, 13, 0, index);
  const createMiddleSchoolShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roleMiddleSchool, 12, 30, 13, 0, index);
  const createWorshipShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roleWorship, 12, 0, 12, 30, index);

  it("should generate a schedule for December 2025", () => {
    const shifts: SchedulerShift[] = [
      // 12-07
      createNurseryShift(date07),
      createKidsWorshipShift(date07),
      createPreschoolShift(date07),
      createElementaryShift(date07),
      createMiddleSchoolShift(date07),
      createWorshipShift(date07, 0),
      createWorshipShift(date07, 1),
      createWorshipShift(date07, 2),

      // 12-14
      createNurseryShift(date14),
      createKidsWorshipShift(date14),
      createPreschoolShift(date14),
      createElementaryShift(date14),
      createMiddleSchoolShift(date14),
      createWorshipShift(date14, 0),
      createWorshipShift(date14, 1),
      createWorshipShift(date14, 2),

      // 12-21 (No Middle School)
      createNurseryShift(date21),
      createKidsWorshipShift(date21),
      createPreschoolShift(date21),
      createElementaryShift(date21),
      // No Middle School
      createWorshipShift(date21, 0),
      createWorshipShift(date21, 1),
      createWorshipShift(date21, 2),

      // 12-28
      createNurseryShift(date28),
      createKidsWorshipShift(date28),
      createPreschoolShift(date28),
      createElementaryShift(date28),
      createMiddleSchoolShift(date28),
      createWorshipShift(date28, 0),
      createWorshipShift(date28, 1),
      createWorshipShift(date28, 2),
    ];

    const results = generateSchedule(shifts, users);

    // Analyze results
    const assignmentsByDate = results.reduce((acc, curr) => {
      const date = curr.shiftId.split("-").slice(1, 4).join("-");
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {} as Record<string, typeof results>);

    console.log("\n=== SCHEDULE RESULTS ===");
    console.log("Total Assignments:", results.length);
    console.log("\nAssignments by Date:");
    Object.keys(assignmentsByDate)
      .sort()
      .forEach((date) => {
        console.log(`\n${date}:`);
        assignmentsByDate[date].forEach((a) => {
          const shift = shifts.find((s) => s.id === a.shiftId);
          const startTime = shift?.start.toISOString().substring(11, 16);
          const endTime = shift?.end.toISOString().substring(11, 16);
          console.log(
            `  ${a.userId} -> ${
              a.shiftId.split("-")[0]
            } (${startTime}-${endTime})`
          );
        });
      });

    // Basic assertions
    expect(results.length).toBeGreaterThan(0);

    // Verify no double bookings (same person assigned to overlapping shifts)
    users.forEach((user) => {
      const userAssignments = results.filter((a) => a.userId === user.id);
      const userShifts = userAssignments.map(
        (a) => shifts.find((s) => s.id === a.shiftId)!
      );

      for (let i = 0; i < userShifts.length; i++) {
        for (let j = i + 1; j < userShifts.length; j++) {
          const shift1 = userShifts[i];
          const shift2 = userShifts[j];

          // Check if shifts overlap
          const overlap =
            shift1.start < shift2.end && shift2.start < shift1.end;
          expect(overlap).toBe(false);
        }
      }
    });

    // Verify users are only assigned when available
    results.forEach((assignment) => {
      const user = users.find((u) => u.id === assignment.userId)!;
      const shift = shifts.find((s) => s.id === assignment.shiftId)!;
      const shiftDate = assignment.shiftId.split("-").slice(1, 4).join("-");

      // If user has availableEvents specified, they should only be assigned on those dates
      if (user.availableEvents && user.availableEvents.length > 0) {
        expect(user.availableEvents).toContain(shiftDate);
      }
    });
  });
});

