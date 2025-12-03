import { describe, it, expect } from "vitest";
import { generateSchedule, SchedulerShift, SchedulerUser } from "./scheduler";

describe("Complex Schedule Scenario", () => {
  // Roles
  const roles = {
    nursery: { roleId: "Nursery", type: "required" as const },
    kidsWorship: { roleId: "Kids Worship", type: "required" as const },
    preschool: { roleId: "Preschool", type: "required" as const },
    elementary: { roleId: "Elementary", type: "required" as const },
    middleSchool: { roleId: "Middle School", type: "optional" as const },
    worshipLeader: { roleId: "Worship Leader", type: "optional" as const },
    baseGuitar: { roleId: "Base Guitar", type: "optional" as const },
    electricGuitar: { roleId: "Electric Guitar", type: "optional" as const },
    acousticGuitar: { roleId: "Acoustic Guitar", type: "optional" as const },
    keyboard: { roleId: "Keyboard", type: "optional" as const },
    drums: { roleId: "Drums", type: "optional" as const },
    piano: { roleId: "Piano", type: "optional" as const },
    vocals: { roleId: "Vocals", type: "optional" as const },
  } as const;

  // Dates
  const date07 = "2025-12-07";
  const date14 = "2025-12-14";
  const date21 = "2025-12-21";
  const date28 = "2025-12-28";

  // Users
  const users: SchedulerUser[] = [
    { id: "Leila Alhindi", roles: [roles.nursery], availableEvents: [] },
    {
      id: "Lillian Nackasha",
      roles: [roles.nursery, roles.kidsWorship],
      availableEvents: [date14, date28],
    },
    {
      id: "Rebecca Yonan",
      roles: [
        roles.nursery,
        roles.kidsWorship,
        roles.elementary,
        roles.middleSchool,
        roles.vocals,
      ],
      availableEvents: [date14, date21, date28],
    },
    {
      id: "Shams Morolli",
      roles: [
        roles.nursery,
        roles.kidsWorship,
        roles.middleSchool,
        roles.vocals,
      ],
      availableEvents: [],
    },
    { id: "Shantal AlNajar", roles: [roles.nursery], availableEvents: [] },
    {
      id: "Marianne Salman",
      roles: [
        roles.nursery,
        roles.preschool,
        roles.elementary,
        roles.middleSchool,
      ],
      availableEvents: [date14, date28],
    },
    {
      id: "Christa Kasbrooks",
      roles: [roles.kidsWorship, roles.vocals],
      availableEvents: [],
    },
    {
      id: "Nada Yousif",
      roles: [roles.kidsWorship, roles.elementary],
      availableEvents: [],
    },
    {
      id: "Nana Akrawi",
      roles: [roles.kidsWorship, roles.elementary],
      availableEvents: [],
    },
    {
      id: "Zina Hannah",
      roles: [roles.kidsWorship, roles.preschool, roles.middleSchool],
      availableEvents: [date21, date28],
    },
    {
      id: "Christine Awabdeh",
      roles: [roles.preschool],
      availableEvents: [date14],
    },
    { id: "Gracie Fram", roles: [roles.preschool], availableEvents: [date07] },
    {
      id: "Mikayla Hannah",
      roles: [roles.preschool],
      availableEvents: [date21],
    },
    {
      id: "Ricky Kasbrooks",
      roles: [roles.preschool, roles.elementary, roles.middleSchool],
      availableEvents: [],
    },
    {
      id: "Sally Haddad",
      roles: [roles.elementary],
      availableEvents: [date14],
    },
    { id: "Dalia Jamil", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Erica Kaspo", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Manny Salman", roles: [roles.middleSchool], availableEvents: [] },
    { id: "Alex Kaspo", roles: [roles.drums], availableEvents: [] },
    {
      id: "Andrew Awabdeh",
      roles: [roles.worshipLeader, roles.keyboard, roles.vocals],
      availableEvents: [date07, date14, date21, date28],
    },
    {
      id: "Anthony Morolli",
      roles: [roles.baseGuitar],
      availableEvents: [date07, date14, date21, date28],
    },
    { id: "Hashem Alfay", roles: [roles.acousticGuitar], availableEvents: [] },
    { id: "Jamil Haddad", roles: [roles.acousticGuitar], availableEvents: [] },
    { id: "Jeremy Ishow", roles: [roles.drums], availableEvents: [] },
    {
      id: "Jonah Yonan",
      roles: [
        roles.vocals,
        roles.electricGuitar,
        roles.piano,
        roles.keyboard,
        roles.worshipLeader,
      ],
      availableEvents: [date07, date14, date21, date28],
    },
    { id: "Nicole Said", roles: [roles.vocals], availableEvents: [] },
    {
      id: "Rabi Alhindi",
      roles: [roles.vocals, roles.acousticGuitar],
      availableEvents: [],
    },
    { id: "Razan Yared", roles: [roles.vocals], availableEvents: [] },
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
    createShift(dateStr, roles.nursery.roleId, 12, 0, 13, 0, index);
  const createKidsWorshipShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.kidsWorship.roleId, 12, 0, 12, 30, index);
  const createPreschoolShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.preschool.roleId, 12, 30, 13, 0, index);
  const createElementaryShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.elementary.roleId, 12, 30, 13, 0, index);
  const createMiddleSchoolShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.middleSchool.roleId, 12, 30, 13, 0, index);
  const createWorshipLeaderShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.worshipLeader.roleId, 12, 0, 12, 30, index);
  const createVocalsShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.vocals.roleId, 12, 0, 12, 30, index);
  const createDrumsShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.drums.roleId, 12, 0, 12, 30, index);
  const createBaseGuitarShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.baseGuitar.roleId, 12, 0, 12, 30, index);
  const createElectricGuitarShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.electricGuitar.roleId, 12, 0, 12, 30, index);
  const createAcousticGuitarShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.acousticGuitar.roleId, 12, 0, 12, 30, index);
  const createKeyboardShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.keyboard.roleId, 12, 0, 12, 30, index);
  const createPianoShift = (dateStr: string, index: number = 0) =>
    createShift(dateStr, roles.piano.roleId, 12, 0, 12, 30, index);

  it("should generate a schedule for December 2025", () => {
    const shifts: SchedulerShift[] = [
      // 12-07
      createNurseryShift(date07),
      createKidsWorshipShift(date07),
      createPreschoolShift(date07),
      createElementaryShift(date07),
      createMiddleSchoolShift(date07),
      createWorshipLeaderShift(date07),
      createVocalsShift(date07),
      createDrumsShift(date07),
      createBaseGuitarShift(date07),
      createElectricGuitarShift(date07),
      createAcousticGuitarShift(date07),
      createKeyboardShift(date07),
      createPianoShift(date07),

      // 12-14
      createNurseryShift(date14),
      createKidsWorshipShift(date14),
      createPreschoolShift(date14),
      createElementaryShift(date14),
      createMiddleSchoolShift(date14),
      createWorshipLeaderShift(date14),
      createVocalsShift(date14),
      createDrumsShift(date14),
      createBaseGuitarShift(date14),
      createElectricGuitarShift(date14),
      createAcousticGuitarShift(date14),
      createKeyboardShift(date14),
      createPianoShift(date14),

      // 12-21 (No Middle School)
      createNurseryShift(date21),
      createKidsWorshipShift(date21),
      createPreschoolShift(date21),
      createElementaryShift(date21),
      // No Middle School
      createWorshipLeaderShift(date21),
      createVocalsShift(date21),
      createDrumsShift(date21),
      createBaseGuitarShift(date21),
      createElectricGuitarShift(date21),
      createAcousticGuitarShift(date21),
      createKeyboardShift(date21),
      createPianoShift(date21),

      // 12-28
      createNurseryShift(date28),
      createKidsWorshipShift(date28),
      createPreschoolShift(date28),
      createElementaryShift(date28),
      createMiddleSchoolShift(date28),
      createWorshipLeaderShift(date28),
      createVocalsShift(date28),
      createDrumsShift(date28),
      createBaseGuitarShift(date28),
      createElectricGuitarShift(date28),
      createAcousticGuitarShift(date28),
      createKeyboardShift(date28),
      createPianoShift(date28),
    ];

    const results = generateSchedule(shifts, users);

    // Analyze results
    console.log("\n=== SCHEDULE RESULTS ===");
    console.log("Total Assignments:", results.length);
    console.log("\nAssignments by Date:");

    const dates = Array.from(
      new Set(shifts.map((s) => s.id.split("-").slice(1, 4).join("-")))
    ).sort();

    dates.forEach((date) => {
      console.log(`\n${date}:`);
      const shiftsForDate = shifts.filter((s) => s.id.includes(date));

      shiftsForDate.forEach((shift) => {
        const assignment = results.find((r) => r.shiftId === shift.id);
        const startTime = shift.start.toISOString().substring(11, 16);
        const endTime = shift.end.toISOString().substring(11, 16);

        // Find role definition
        const roleDef = Object.values(roles).find(
          (r) => r.roleId === shift.roleId
        );
        const isRequired = roleDef?.type === "required";

        if (assignment) {
          console.log(
            `  ✅ ${assignment.userId} -> ${shift.roleId} (${startTime}-${endTime})`
          );
        } else if (isRequired) {
          console.log(
            `  ❌ MISSING REQUIRED: ${shift.roleId} (${startTime}-${endTime})`
          );
        } else {
          console.log(
            `  ⚪ Unfilled Optional: ${shift.roleId} (${startTime}-${endTime})`
          );
        }
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

